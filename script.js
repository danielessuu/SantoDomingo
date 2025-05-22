document.addEventListener("DOMContentLoaded", () => {
    cargarMenu();
    actualizarCarrito();
    updateHeaderCartCount();
    document.getElementById("ordenar-comida-btn").addEventListener("click", ordenarComida);
});
 
async function cargarMenu() {
    try {
        const respuesta = await fetch("https://santodomingo.onrender.com/platos/");
        if (!respuesta.ok) {
            throw new Error(`HTTP error! status: ${respuesta.status}`);
        }
        const datos = await respuesta.json();
        const menuContainer = document.getElementById("menu-dinamico");

        const categorias = {};
        datos.forEach(producto => {
            if (!categorias[producto.categoria]) categorias[producto.categoria] = [];
            categorias[producto.categoria].push(producto);
        });

        const ordenCategorias = ["Entradas", "Platos Fuertes", "Bebidas", "Postres"];
        ordenCategorias.forEach(categoria => {
            if (categorias[categoria] && categorias[categoria].length > 0) {
                const sectionDiv = document.createElement("div");
                sectionDiv.classList.add("menu-section");
                sectionDiv.innerHTML = `
                    <h4>${getIconoCategoria(categoria)} ${categoria}</h4>
                    <div class="menu-grid"></div>
                `;
                const gridDiv = sectionDiv.querySelector(".menu-grid");

                categorias[categoria].forEach(producto => {
                    // Si la imagen es relativa, agrega el dominio del backend
                    let imageUrl = producto.url_imagen;
                    if (imageUrl && imageUrl.startsWith('/')) {
                        imageUrl = 'https://backend-sd3.onrender.com' + imageUrl;
                    }
                    gridDiv.innerHTML += `
                        <div class="categoria">
                            <h4>${producto.nombre}</h4>
                            <img src="${imageUrl}" alt="${producto.nombre}">
                            <p>${producto.descripcion}</p>
                            <span>$${parseFloat(producto.precio).toFixed(2)}</span>
                            <button onclick="agregarAlCarrito('${producto.id}', '${producto.nombre}', ${producto.precio})">Agregar</button>
                        </div>
                    `;
                });

                menuContainer.appendChild(sectionDiv);
            }
        });
    } catch (error) {
        console.error("Error al cargar el menú:", error);
        showOrderMessage("No se pudo cargar el menú. Revisa tu conexión o intenta más tarde.");
    }
}
 
function getIconoCategoria(categoria) {
    return {
        "Entradas": "🥗",
        "Platos Fuertes": "🍽️",
        "Bebidas": "🍹",
        "Postres": "🍨"
    }[categoria] || "";
}
 
let carrito = {};
 
function agregarAlCarrito(id, nombre, precio) {
    if (carrito[id]) {
        carrito[id].cantidad += 1;
    } else {
        carrito[id] = { nombre: nombre, precio: precio, cantidad: 1 };
    }
    actualizarCarrito();
    updateHeaderCartCount();
}
 
function actualizarCarrito() {
    const cartItems = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");
    const headerCartCount = document.getElementById("cart-count");
    const cartItemsCount = document.getElementById("header-cart-count");
 
    if (!cartItems || !cartTotal || !headerCartCount) {
        console.error("No se encontraron elementos del carrito.");
        return;
    }
 
    cartItems.innerHTML = "";
    let totalItems = 0;
    let totalPrice = 0;
 
    for (const [id, item] of Object.entries(carrito)) {
        totalItems += item.cantidad;
        totalPrice += item.precio * item.cantidad;
 
        const listItem = document.createElement("li");
        listItem.className = "cart-item";
        listItem.innerHTML = `
            <span>${item.nombre} - $${item.precio} x ${item.cantidad}</span>
            <div>
                <button onclick="modificarCantidad('${id}', -1)">-</button>
                <button onclick="modificarCantidad('${id}', 1)">+</button>
            </div>
        `;
        cartItems.appendChild(listItem);
    }
 
    headerCartCount.textContent = totalItems;
    cartItemsCount.textContent = totalItems;
    cartTotal.textContent = totalPrice.toFixed(2);
}
 
function modificarCantidad(id, cambio) {
    if (carrito[id]) {
        carrito[id].cantidad += cambio;
        if (carrito[id].cantidad <= 0) {
            delete carrito[id];
        }
        actualizarCarrito();
        updateHeaderCartCount();
    }
}
 
function vaciarCarrito() {
    carrito = {};
    actualizarCarrito();
    updateHeaderCartCount();
}
 
function showOrderMessage(message) {
    const messageBox = document.getElementById("order-message");
    const messageText = document.getElementById("order-message-text");
 
    if (messageBox && messageText) {
        messageText.textContent = message;
        messageBox.style.display = "block";
        messageBox.classList.remove("hide");
        messageBox.classList.add("show");
 
        setTimeout(() => {
            messageBox.classList.remove("show");
            messageBox.classList.add("hide");
            setTimeout(() => {
                messageBox.style.display = "none";
            }, 500);
        }, 3000);
    }
}
 
function ordenarComida(event) {
    event.preventDefault();
 
    if (Object.keys(carrito).length === 0) {
        showOrderMessage("El carrito está vacío. Agrega ítems antes de ordenar.");
        return;
    }
 
    const clienteForm = document.getElementById("cliente-form");
    clienteForm.style.display = "block";
 
    document.getElementById("nombre").value = "";
    document.getElementById("telefono").value = "";
    document.getElementById("direccion").value = "";
 
    document.getElementById("nombre").focus();
}
 
async function enviarPedido() {
    const nombre = document.getElementById("nombre").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const direccion = document.getElementById("direccion").value.trim();

    if (!nombre || !telefono || !direccion) {
        showOrderMessage("Por favor, completa todos los campos del cliente.");
        return;
    }

    const productos = Object.entries(carrito).map(([id, item]) => ({
        plato_id: parseInt(id),
        cantidad: item.cantidad
    }));

    const total = Object.values(carrito).reduce((sum, item) => sum + item.precio * item.cantidad, 0);

    const pedido = {
        nombre_cliente: nombre,
        telefono_cliente: telefono,
        direccion_cliente: direccion,
        items: productos
    };

    try {
        const response = await fetch("https://santodomingo.onrender.com/pedidos/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(pedido)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        showOrderMessage("¡Tu pedido ha sido enviado con éxito! Gracias por elegir Santo Domingo.");
        vaciarCarrito();
        cerrarFormulario();
    } catch (error) {
        console.error("Error al enviar el pedido:", error);
        showOrderMessage("Hubo un error al realizar el pedido. Intenta nuevamente.");
    }
}
 
function cerrarFormulario() {
    const clienteForm = document.getElementById("cliente-form");
    clienteForm.style.display = "none";
}
 
function toggleCarrito() {
    const cart = document.getElementById("cart");
    if (cart) {
        cart.classList.toggle("active");
    }
}
 
function updateHeaderCartCount() {
    const headerCartCount = document.getElementById("cart-count");
    const totalItems = Object.values(carrito).reduce((sum, item) => sum + item.cantidad, 0);
    if (headerCartCount) {
        headerCartCount.textContent = totalItems;
    }
}