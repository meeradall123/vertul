// Firebase initialization (use your config)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();

// Elements
const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const logoutBtn = document.getElementById("logoutBtn");
const friendsList = document.getElementById("friendsList");

// Current user
let currentUser;

// Check auth
auth.onAuthStateChanged(user => {
    if (!user) return window.location.href = "login.html";
    currentUser = user;
    loadFriends();
    loadMessages();
});

// Logout
logoutBtn.addEventListener("click", () => auth.signOut().then(() => window.location.href = "login.html"));

// Send message
sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", e => { if (e.key === "Enter") sendMessage(); });

function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;
    const timestamp = Date.now();
    db.ref("messages/general").push({
        user: currentUser.email,
        text,
        timestamp
    });
    messageInput.value = "";
}

// Load messages real-time
function loadMessages() {
    const ref = db.ref("messages/general");
    ref.off(); // remove old listeners

    ref.on("child_added", snapshot => {
        const msg = snapshot.val();
        const isSelf = msg.user === currentUser.email;

        const div = document.createElement("div");
        div.classList.add("message");
        if (isSelf) div.classList.add("self");

        const avatar = document.createElement("div");
        avatar.classList.add("avatar");
        avatar.innerText = msg.user[0].toUpperCase();

        const content = document.createElement("div");
        content.classList.add("content");
        content.innerHTML = `<strong>${msg.user}</strong>: ${msg.text}`;

        const timestamp = document.createElement("span");
        timestamp.classList.add("timestamp");
        const date = new Date(msg.timestamp);
        timestamp.innerText = `${date.getHours()}:${date.getMinutes().toString().padStart(2,'0')}`;

        content.appendChild(timestamp);
        div.appendChild(avatar);
        div.appendChild(content);
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

// Load friends
function loadFriends() {
    const userRef = db.ref("users/" + currentUser.uid + "/friends");
    userRef.off();

    userRef.on("value", snapshot => {
        friendsList.innerHTML = '';
        snapshot.forEach(child => {
            const li = document.createElement("li");
            li.innerText = child.val().email;
            friendsList.appendChild(li);
        });
    });
}
