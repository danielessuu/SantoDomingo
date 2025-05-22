document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "./login.html";
        return;
    }

    // Cargar todos los pedidos al iniciar
    cargarPedidos();

    // Evento para filtro por estado
    const filtroEstado = document.getElementById("filtro-estado");
    if (filtroEstado) {
        filtroEstado.addEventListener("change", cargarPedidos);
    }

    // Evento para filtro por ID de pedido
    const filtroPedidoId = document.getElementById("filtro-pedido-id");
    if (filtroPedidoId) {
        filtroPedidoId.addEventListener("input", filtrarPedidos);
    }

    // Evento para filtro por nombre de cliente
    const filtroNombreCliente = document.getElementById("filtro-nombre-cliente");
    if (filtroNombreCliente) {
        filtroNombreCliente.addEventListener("input", filtrarPedidos);
    }

    // Evento para botón "Mostrar Todos"
    const mostrarTodosBtn = document.getElementById("mostrar-todos");
    if (mostrarTodosBtn) {
        mostrarTodosBtn.addEventListener("click", () => {
            filtroPedidoId.value = ""; // Limpiar el input
            filtroNombreCliente.value = ""; // Limpiar nombre
            cargarPedidos(); // Recargar todos los pedidos
        });
    }

    // Evento para cerrar sesión
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("token");
            window.location.href = "./login.html";
        });
    }
});

async function cargarPedidos() {
    const token = localStorage.getItem("token");
    const filtroEstado = document.getElementById("filtro-estado");
    const ordersList = document.getElementById("orders-list");
    const messageBox = document.getElementById("order-message");

    if (!ordersList || !messageBox) {
        console.error("Elementos de la interfaz no encontrados.");
        return;
    }

    ordersList.innerHTML = "";
    messageBox.style.display = "none";

    try {
        // Construir la URL con filtro por estado si aplica
        let url = "https://santodomingo.onrender.com/pedidos/";
        if (filtroEstado && filtroEstado.value) {
            url += `?estado=${filtroEstado.value}`;
        }

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const pedidos = await response.json();
        mostrarPedidos(pedidos);
    } catch (error) {
        console.error("Error al cargar los pedidos:", error);
        messageBox.textContent = "Error al cargar los pedidos. Intenta nuevamente.";
        messageBox.style.display = "block";
    }
}

async function filtrarPedidos() {
    const filtroPedidoId = document.getElementById("filtro-pedido-id");
    const filtroNombreCliente = document.getElementById("filtro-nombre-cliente");
    const ordersList = document.getElementById("orders-list");
    const messageBox = document.getElementById("order-message");

    if (!filtroPedidoId || !filtroNombreCliente || !ordersList || !messageBox) {
        console.error("Elementos de la interfaz no encontrados.");
        return;
    }

    const id = filtroPedidoId.value.trim();
    const nombre = filtroNombreCliente.value.trim();

    ordersList.innerHTML = "";
    messageBox.style.display = "none";

    // Priorizar filtro por ID si está presente
    if (id) {
        if (isNaN(id) || id <= 0) {
            messageBox.textContent = "Por favor, ingresa un ID de pedido válido.";
            messageBox.style.display = "block";
            ordersList.innerHTML = "";
            return;
        }

        try {
            const response = await fetch(`https://santodomingo.onrender.com/pedidos/${id}/`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    messageBox.textContent = "No se encontró un pedido con ese ID.";
                    messageBox.style.display = "block";
                    ordersList.innerHTML = "";
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const pedido = await response.json();
            mostrarPedidos([pedido]); // Convertir a array
        } catch (error) {
            console.error("Error al filtrar por ID:", error);
            messageBox.textContent = "Error al filtrar el pedido. Intenta nuevamente.";
            messageBox.style.display = "block";
        }
    } else if (nombre) {
        // Filtro por nombre si no hay ID
        try {
            const response = await fetch(`https://santodomingo.onrender.com/pedidos/?nombre_cliente=${encodeURIComponent(nombre)}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const pedidos = await response.json();
            if (pedidos.length === 0) {
                messageBox.textContent = "No se encontraron pedidos para ese cliente.";
                messageBox.style.display = "block";
                ordersList.innerHTML = "";
                return;
            }
            mostrarPedidos(pedidos);
        } catch (error) {
            console.error("Error al filtrar por nombre:", error);
            messageBox.textContent = "Error al filtrar pedidos. Intenta nuevamente.";
            messageBox.style.display = "block";
        }
    } else {
        // Si ambos filtros están vacíos, cargar todos
        cargarPedidos();
    }
}

function mostrarPedidos(pedidos) {
    const ordersList = document.getElementById("orders-list");
    if (!ordersList) return;

    ordersList.innerHTML = "";

    if (!pedidos || pedidos.length === 0) {
        ordersList.innerHTML = "<p>No se encontraron pedidos.</p>";
        return;
    }

    pedidos.forEach(pedido => {
        const pedidoDiv = document.createElement("div");
        pedidoDiv.classList.add("order-item");

        // Generar HTML para ítems
        const itemsHtml = pedido.items.map(item => `
            <li>${item.plato_nombre} - $${parseFloat(item.precio).toFixed(2)} x ${item.cantidad}</li>
        `).join("");

        pedidoDiv.innerHTML = `
            <h4>Pedido #${pedido.pedido_id}</h4>
            <p><strong>Cliente:</strong> ${pedido.nombre_cliente}</p>
            <p><strong>Teléfono:</strong> ${pedido.telefono_cliente}</p>
            <p><strong>Dirección:</strong> ${pedido.direccion_cliente}</p>
            <p><strong>Estado:</strong> ${pedido.estado === "pendiente" ? "Pendiente" : "Atendido"}</p>
            <p><strong>Fecha:</strong> ${new Date(pedido.creado_en).toLocaleString()}</p>
            <ul>${itemsHtml}</ul>
            <p><strong>Total:</strong> $${parseFloat(pedido.precio_total).toFixed(2)}</p>
            ${pedido.estado === "pendiente" ? `<button onclick="marcarAtendido(${pedido.pedido_id})">Marcar como Atendido</button>` : ""}
        `;

        ordersList.appendChild(pedidoDiv);
    });
}

async function marcarAtendido(pedidoId) {
    const token = localStorage.getItem("token");
    const messageBox = document.getElementById("order-message");

    try {
        const response = await fetch(`https://santodomingo.onrender.com/pedidos/${pedidoId}/actualizar_estado/`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ estado: "atendido" })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        messageBox.textContent = `Pedido #${pedidoId} marcado como atendido.`;
        messageBox.style.display = "block";
        setTimeout(() => messageBox.style.display = "none", 3000);

        // Recargar pedidos
        cargarPedidos();
    } catch (error) {
        console.error("Error al marcar como atendido:", error);
        messageBox.textContent = "Error al actualizar el pedido. Intenta nuevamente.";
        messageBox.style.display = "block";
    }
}