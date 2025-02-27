const apiUrl = 'http://localhost:3000';

async function issueTokens() {
    const response = await fetch(`${apiUrl}/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: "0xRecipientAddressHere", amount: 1000 })
    });
    const data = await response.json();
    document.getElementById('output').innerText = JSON.stringify(data, null, 2);
}

async function transferTokens() {
    const response = await fetch(`${apiUrl}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: "0xAnotherAddressHere", amount: 500 })
    });
    const data = await response.json();
    document.getElementById('output').innerText = JSON.stringify(data, null, 2);
}

async function redeemTokens() {
    const response = await fetch(`${apiUrl}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: "0xRecipientAddressHere", amount: 500 })
    });
    const data = await response.json();
    document.getElementById('output').innerText = JSON.stringify(data, null, 2);
}

async function autoSettle() {
    const response = await fetch(`${apiUrl}/autoSettle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: "0xRecipientAddressHere" })
    });
    const data = await response.json();
    document.getElementById('output').innerText = JSON.stringify(data, null, 2);
}
