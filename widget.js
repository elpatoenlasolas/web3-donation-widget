(function() {
    const container = document.getElementById('donation-widget');
    if (!container) {
        console.error('Donation widget container not found. Please ensure there is a <div id="donation-widget"> in your HTML.');
        return;
    }

    const recipientAddress = container.getAttribute('data-recipient') || null;
    const minDonation = parseFloat(container.getAttribute('data-min-donation') || '0.001');

    const style = document.createElement('style');
    style.textContent = `
        .donation-widget-container {
            font-family: Arial, sans-serif;
        }
        .donate-init-btn {
            background: #00cc88;
            color: #ffffff;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1.2rem;
            font-weight: bold;
            transition: background 0.2s, transform 0.1s;
        }
        .donate-init-btn:hover {
            background: #00b377;
            transform: scale(1.02);
        }
        .donate-init-btn:active {
            transform: scale(0.98);
        }
        .donation-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .donation-modal-content {
            background: #1a1a1a;
            padding: 25px;
            border-radius: 12px;
            max-width: 400px;
            width: 90%;
            color: #ffffff;
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
            animation: fadeIn 0.3s ease-in;
        }
        .donation-modal header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .donation-modal h2 {
            margin: 0;
            font-size: 1.6rem;
            font-weight: bold;
        }
        .close-btn {
            background: none;
            border: none;
            color: #ffffff;
            font-size: 1.8rem;
            cursor: pointer;
            transition: color 0.2s;
        }
        .close-btn:hover {
            color: #ff4444;
        }
        .donation-modal form {
            display: flex;
            flex-direction: column;
        }
        .donation-modal label {
            margin-bottom: 8px;
            font-size: 1.1rem;
        }
        .donation-modal input[type="number"] {
            width: 100%;
            padding: 10px;
            border: 1px solid #444;
            border-radius: 6px;
            background: #222;
            color: #ffffff;
            margin-bottom: 10px;
            box-sizing: border-box;
            font-size: 1rem;
        }
        .donation-modal .hint {
            font-size: 0.9rem;
            color: #aaaaaa;
            margin-bottom: 20px;
        }
        .donate-btn {
            background: #00cc88;
            color: #ffffff;
            padding: 12px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1.2rem;
            font-weight: bold;
            transition: background 0.2s, transform 0.1s;
            width: 100%;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .donate-btn:hover {
            background: #00b377;
            transform: scale(1.02);
        }
        .donate-btn:active {
            transform: scale(0.98);
        }
        .wallet-status {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
            font-size: 0.9rem;
        }
        .wallet-status span {
            color: #aaaaaa;
        }
        .connect-btn, .disconnect-btn {
            background: #444;
            color: #ffffff;
            padding: 8px 15px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.2s;
        }
        .connect-btn:hover, .disconnect-btn:hover {
            background: #555;
        }
        .error-message, .success-message {
            font-size: 0.9rem;
            margin-top: 10px;
            padding: 10px;
            border-radius: 4px;
            display: none;
            text-align: center;
        }
        .error-message {
            background: #ff4444;
            color: #ffffff;
        }
        .success-message {
            background: #00cc88;
            color: #ffffff;
        }
        .confirmation-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            justify-content: center;
            align-items: center;
            z-index: 1001;
        }
        .confirmation-modal-content {
            background: #1a1a1a;
            padding: 20px;
            border-radius: 12px;
            max-width: 400px;
            width: 90%;
            color: #ffffff;
            text-align: center;
        }
        .confirmation-modal-content h3 {
            margin: 0 0 15px;
            font-size: 1.4rem;
        }
        .confirmation-modal-content p {
            font-size: 0.9rem;
            word-break: break-all;
            color: #aaaaaa;
        }
        .confirmation-close-btn {
            background: #00cc88;
            color: #ffffff;
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            margin-top: 15px;
            transition: background 0.2s;
        }
        .confirmation-close-btn:hover {
            background: #00b377;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
        }
        @media (max-width: 600px) {
            .donation-modal-content, .confirmation-modal-content {
                width: 95%;
                padding: 15px;
            }
            .donate-btn, .confirmation-close-btn {
                font-size: 1.1rem;
                padding: 10px;
            }
        }
    `;
    document.head.appendChild(style);

    // Load ethers.js
    const ethersScript = document.createElement('script');
    ethersScript.src = 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js';
    ethersScript.onerror = () => {
        console.error('Failed to load ethers.js. Please check your internet connection or try again later.');
        container.innerHTML = '<p style="color: red; font-family: Arial, sans-serif;">Error: Failed to load donation widget. Please try again later.</p>';
    };
    ethersScript.onload = initializeWidget;
    document.head.appendChild(ethersScript);

    function initializeWidget() {
        // Validate recipient address after ethers.js is loaded
        if (!recipientAddress || !ethers.utils.isAddress(recipientAddress)) {
            console.error('Invalid recipient address in data-recipient attribute. Please provide a valid Ethereum address (e.g., 0x123...).');
            container.innerHTML = '<p style="color: red; font-family: Arial, sans-serif;">Error: Invalid recipient address. Please contact the website owner to fix the donation widget configuration.</p>';
            return;
        }

        // Render widget UI
        container.innerHTML = `
            <div class="donation-widget-container">
                <button class="donate-init-btn">DONATE</button>
                <div class="donation-modal" id="donation-modal">
                    <div class="donation-modal-content">
                        <header>
                            <h2>Support this project</h2>
                            <button aria-label="Close donation modal" class="close-btn">×</button>
                        </header>
                        <form id="donation-form">
                            <label for="donation-amount">Amount (ETH)</label>
                            <input type="number" id="donation-amount" step="0.001" min="${minDonation}" placeholder="${minDonation}" required>
                            <p class="hint">Minimum donation is ${minDonation} ETH</p>
                            <button type="submit" class="donate-btn">Send Donation</button>
                            <p class="error-message" id="error-message">The minimum donation is ${minDonation} ETH</p>
                            <p class="success-message" id="success-message">Processing donation...</p>
                        </form>
                        <div class="wallet-status">
                            <span id="wallet-status-text">Not connected</span>
                            <button type="button" class="connect-btn" id="connect-btn">Connect Wallet</button>
                            <button type="button" class="disconnect-btn" id="disconnect-btn" style="display: none;">Disconnect</button>
                        </div>
                    </div>
                </div>
                <div class="confirmation-modal" id="confirmation-modal">
                    <div class="confirmation-modal-content">
                        <h3>Donation Successful!</h3>
                        <p id="transaction-hash">Transaction Hash: Loading...</p>
                        <button class="confirmation-close-btn">Close</button>
                    </div>
                </div>
            </div>
        `;

        // Initialize event listeners
        const donateInitBtn = container.querySelector('.donate-init-btn');
        const donationModal = container.querySelector('#donation-modal');
        const confirmationModal = container.querySelector('#confirmation-modal');
        const walletStatusText = container.querySelector('#wallet-status-text');
        const connectBtn = container.querySelector('#connect-btn');
        const disconnectBtn = container.querySelector('#disconnect-btn');
        const donationForm = container.querySelector('#donation-form');
        const errorMessage = container.querySelector('#error-message');
        const successMessage = container.querySelector('#success-message');
        const donationCloseBtn = container.querySelector('.close-btn');
        const confirmationCloseBtn = container.querySelector('.confirmation-close-btn');
        const transactionHash = container.querySelector('#transaction-hash');

        donateInitBtn.addEventListener('click', () => {
            donationModal.style.display = 'flex';
        });

        donationCloseBtn.addEventListener('click', () => {
            donationModal.style.display = 'none';
            resetMessages();
        });

        confirmationCloseBtn.addEventListener('click', () => {
            confirmationModal.style.display = 'none';
            donationModal.style.display = 'none';
        });

        async function connectWallet() {
            if (window.ethereum) {
                try {
                    await window.ethereum.request({ method: 'eth_requestAccounts' });
                    walletStatusText.textContent = 'Connected';
                    connectBtn.style.display = 'none';
                    disconnectBtn.style.display = 'inline-block';
                } catch (error) {
                    console.error('Error connecting wallet:', error);
                    showError('Failed to connect wallet. Please try again.');
                }
            } else {
                showError('Please install MetaMask or another Ethereum wallet!');
            }
        }
        connectBtn.addEventListener('click', connectWallet);

        disconnectBtn.addEventListener('click', () => {
            walletStatusText.textContent = 'Not connected';
            disconnectBtn.style.display = 'none';
            connectBtn.style.display = 'inline-block';
        });

        donationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const amount = parseFloat(container.querySelector('#donation-amount').value);

            resetMessages();
            if (amount < minDonation) {
                showError(`The minimum donation is ${minDonation} ETH`);
                return;
            }
            if (walletStatusText.textContent !== 'Connected') {
                showError('Please connect your wallet first.');
                return;
            }

            try {
                successMessage.textContent = 'Processing donation...';
                successMessage.style.display = 'block';
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const tx = await signer.sendTransaction({
                    to: recipientAddress,
                    value: ethers.utils.parseEther(amount.toString())
                });
                await tx.wait();
                donationModal.style.display = 'none';
                confirmationModal.style.display = 'flex';
                transactionHash.textContent = `Transaction Hash: ${tx.hash}`;
                successMessage.style.display = 'none';
            } catch (error) {
                console.error('Error sending donation:', error);
                let errorMsg = 'Failed to send donation. Please try again.';
                if (error.code === 'UNSUPPORTED_OPERATION' && error.operation === 'getResolver') {
                    errorMsg = 'ENS names are not supported on this network. Please use a valid Ethereum address.';
                }
                showError(errorMsg);
            }
        });

        function resetMessages() {
            errorMessage.style.display = 'none';
            successMessage.style.display = 'none';
        }

        function showError(msg) {
            errorMessage.textContent = msg;
            errorMessage.style.display = 'block';
            setTimeout(() => { errorMessage.style.display = 'none'; }, 5000);
        }
    }
})();