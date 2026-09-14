  const ham = document.querySelector('.ham');
        const links = document.querySelector('.nav-links');

        ham.addEventListener('click', function() {
            links.classList.toggle('show');
        });


        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                links.classList.remove('show');
            });
        });
        document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("menu-container");

  fetch("/api/products")
    .then((response) => response.json())
    .then((products) => {
      container.innerHTML = ""; 

      if (products.length === 0) {
        container.innerHTML = "<p>No items available right now.</p>";
        return;
      }

      products.forEach((item) => {
        const productCard = document.createElement("div");
        productCard.classList.add("product-card");

        productCard.innerHTML = `
          <img src="${item.image_url || 'placeholder.jpg'}" alt="${item.name}">
          <h3>${item.name}</h3>
          <p class="category">${item.category}</p>
          <p class="price">₦${item.price}</p>
        `;

        container.appendChild(productCard);
      });
    })
    .catch((error) => {
      console.error("Error loading products:", error);
      container.innerHTML = "<p>Failed to load menu items.</p>";
    });
});

        let currentQty = 1;
        let cart = [];

        function updateQty(change) {
            currentQty = Math.max(1, currentQty + change);
            document.getElementById('qty-display').innerText = currentQty;
        }

        function addToCart() {
            const flavor = document.getElementById('flavor-select').value;
            const packSelect = document.getElementById('pack-size');
            const unitPrice = parseInt(packSelect.value, 10);
            const sizeLabel = packSelect.options[packSelect.selectedIndex].getAttribute('data-size');

            const existingIndex = cart.findIndex(item => item.flavor === flavor && item.sizeLabel === sizeLabel);

            if (existingIndex > -1) {
                cart[existingIndex].qty += currentQty;
            } else {
                cart.push({
                    flavor: flavor,
                    sizeLabel: sizeLabel,
                    unitPrice: unitPrice,
                    qty: currentQty
                });
            }

            currentQty = 1;
            document.getElementById('qty-display').innerText = currentQty;

            renderCart();
        }

        function removeFromCart(index) {
            cart.splice(index, 1);
            renderCart();
        }

        function renderCart() {
            const cartContainer = document.getElementById('cart-container');
            const cartList = document.getElementById('cart-list');
            const totalDisplay = document.getElementById('total-amount');

            if (cart.length === 0) {
                cartContainer.style.display = 'none';
                totalDisplay.innerText = '₦0';
                return;
            }

            cartContainer.style.display = 'block';
            cartList.innerHTML = '';
            let grandTotal = 0;

            cart.forEach((item, index) => {
                const itemTotal = item.unitPrice * item.qty;
                grandTotal += itemTotal;

                const li = document.createElement('li');
                li.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: #FFFBEB; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 0.5rem; border: 1px solid rgba(217, 119, 6, 0.15); font-size: 0.9rem;';
                li.innerHTML = `
                    <div>
                        <strong>${item.flavor}</strong> (${item.sizeLabel}) x ${item.qty}
                        <br><span style="color: #D97706; font-weight: 700;">₦${itemTotal.toLocaleString()}</span>
                    </div>
                    <button onclick="removeFromCart(${index})" style="background: transparent; border: none; color: #DC2626; font-weight: 700; cursor: pointer; font-size: 1.1rem; padding: 0 0.5rem;">✕</button>
                `;
                cartList.appendChild(li);
            });

            totalDisplay.innerText = '₦' + grandTotal.toLocaleString();
        }

        function sendWhatsAppOrder() {
            if (cart.length === 0) {
                alert('Please add at least one item to your cart before ordering.');
                return;
            }

            let totalAmount = 0;
            let orderDetails = cart.map(item => {
                const subtotal = item.unitPrice * item.qty;
                totalAmount += subtotal;
                return `%0A• ${item.flavor} (${item.sizeLabel}) — Qty: ${item.qty} (₦${subtotal.toLocaleString()})`;
            }).join('');

            const message = `Hello SceeBite! I would like to place an order:${orderDetails}%0A%0A*Grand Total: ₦${totalAmount.toLocaleString()}*`;
            const whatsappNumber = '+2349161497153'; 

            window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
        }

        function filterFlavors(category, clickedBtn) {
            const cards = document.querySelectorAll('.flavor-card');
            const buttons = document.querySelectorAll('.tab-btn');

            buttons.forEach(btn => btn.classList.remove('active'));
            clickedBtn.classList.add('active');

            cards.forEach(card => {
                if (category === 'all' || card.classList.contains(category)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }
