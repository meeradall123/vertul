// ================= Firebase Initialization =================
const firebaseConfig = {
    /* YOUR FIREBASE CONFIG HERE */
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let uid, username, avatar;

// ================= Auth Check =================
auth.onAuthStateChanged(user => {
    if (!user) window.location.href = "login.html";
    else {
        uid = user.uid;
        loadUserData();
        setupFriendsListener();
        setupMessagesListener();
        setOnlineStatus();
    }
});

// ================= Load User Info =================
function loadUserData() {
    db.ref("users/" + uid).once("value").then(snap => {
        const user = snap.val();
        username = user.username;
        avatar = user.avatar;
    });
}

// ================= Online/Offline Status =================
function setOnlineStatus() {
    db.ref("users/" + uid).update({ status: "online" });
    window.addEventListener("beforeunload", () => {
        db.ref("users/" + uid).update({ status: "offline" });
    });
}

// ================= Friends System =================
function setupFriendsListener() {
    db.ref("users").on("value", snap => {
        const users = snap.val();
        const list = document.getElementById("friendsList");
        list.innerHTML = "";
        for (let id in users) {
            if(id !== uid) {
                const user = users[id];
                const dot = user.status === "online" ? "🟢" : "⚪";
                list.innerHTML += `<li>${dot} ${user.username}</li>`;
            }
        }
    });
}

// ================= Chat Messages =================
const chatBox = document.getElementById("chatBox");
document.getElementById("sendBtn").addEventListener("click", sendMessage);
document.getElementById("messageInput").addEventListener("keypress", e => {
    if(e.key === "Enter") sendMessage();
});

function sendMessage() {
    const text = document.getElementById("messageInput").value.trim();
    if(!text) return;
    const msg = {
        text,
        user: username,
        avatar,
        uid,
        timestamp: Date.now(),
        reactions: {}
    };
    const newMsgKey = db.ref("messages").push().key;
    db.ref("messages/" + newMsgKey).set(msg);
    document.getElementById("messageInput").value = "";
}

// ================= Display Messages =================
function setupMessagesListener() {
    db.ref("messages").on("value", snap => {
        const msgs = snap.val();
        chatBox.innerHTML = "";
        for(let id in msgs){
            const m = msgs[id];
            let reactionHtml = "";
            if(m.reactions){
                for(let emoji in m.reactions){
                    reactionHtml += `<span onclick="addReaction('${id}','${emoji}')">${emoji} ${m.reactions[emoji].length}</span> `;
                }
            }
            chatBox.innerHTML += `
                <div class="message">
                    <span class="avatar">${m.avatar}</span>
                    <b>${m.user}</b>: ${m.text} <br>
                    ${reactionHtml}
                    <span class="add-reaction">
                        <span onclick="addReaction('${id}','👍')">👍</span>
                        <span onclick="addReaction('${id}','❤️')">❤️</span>
                    </span>
                </div>`;
        }
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

// ================= Message Reactions =================
function addReaction(msgId, emoji) {
    const ref = db.ref("messages/" + msgId + "/reactions/" + emoji);
    ref.once("value").then(snap => {
        let users = snap.val() || [];
        if(users.includes(uid)) users = users.filter(u => u !== uid);
        else users.push(uid);
        ref.set(users);
    });
}

// ================= Typing Indicator =================
const typingRef = db.ref("typing/" + uid);
const typingIndicator = document.createElement("div");
typingIndicator.id = "typingIndicator";
document.querySelector(".chat-main").appendChild(typingIndicator);

document.getElementById("messageInput").addEventListener("input", () => {
    typingRef.set(true);
    setTimeout(() => typingRef.set(false), 3000);
});

db.ref("typing").on("value", snap => {
    const typing = snap.val() || {};
    let text = "";
    for(let id in typing){
        if(typing[id] && id !== uid){
            text += `${id} is typing... `;
        }
    }
    typingIndicator.innerText = text;
});

// ================= Logout =================
document.getElementById("logoutBtn").addEventListener("click", () => {
    db.ref("users/" + uid).update({ status: "offline" });
    auth.signOut().then(() => window.location.href="login.html");
});
