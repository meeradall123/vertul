// Firebase initialization (same as chat.js)
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
const darkModeBtn = document.getElementById("darkModeBtn");
const changePasswordBtn = document.getElementById("changePasswordBtn");
const newPasswordInput = document.getElementById("newPassword");
const addFriendBtn = document.getElementById("addFriendBtn");
const friendEmailInput = document.getElementById("friendEmail");
const friendsListSettings = document.getElementById("friendsListSettings");
const logoutBtn = document.getElementById("logoutBtn");

let currentUser;

// Auth check
auth.onAuthStateChanged(user => {
    if (!user) return window.location.href = "login.html";
    currentUser = user;
    loadFriends();
});

// Logout
logoutBtn.addEventListener("click", () => auth.signOut().then(() => window.location.href = "login.html"));

// Dark mode toggle
darkModeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
});

// Change password
changePasswordBtn.addEventListener("click", () => {
    const newPass = newPasswordInput.value.trim();
    if (!newPass) return alert("Enter new password");
    currentUser.updatePassword(newPass)
        .then(() => alert("Password updated"))
        .catch(err => alert(err.message));
});

// Add friend
addFriendBtn.addEventListener("click", () => {
    const email = friendEmailInput.value.trim();
    if (!email) return;

    // Search user by email
    db.ref("users").orderByChild("email").equalTo(email).once("value")
        .then(snapshot => {
            if (snapshot.exists()) {
                snapshot.forEach(child => {
                    const friendUid = child.key;
                    if (friendUid === currentUser.uid) return alert("Cannot add yourself");

                    // Add friend request
                    db.ref("friendRequests/" + friendUid + "/" + currentUser.uid).set({
                        from: currentUser.email,
                        status: "pending"
                    });
                    alert("Friend request sent!");
                });
            } else {
                alert("User not found");
            }
        });
});

// Load friends & requests
function loadFriends() {
    const friendsRef = db.ref("users/" + currentUser.uid + "/friends");
    friendsRef.off();

    friendsRef.on("value", snapshot => {
        friendsListSettings.innerHTML = '';
        snapshot.forEach(child => {
            const li = document.createElement("li");
            li.innerText = child.val().email;

            // Remove button
            const removeBtn = document.createElement("button");
            removeBtn.innerText = "Remove";
            removeBtn.addEventListener("click", () => {
                db.ref("users/" + currentUser.uid + "/friends/" + child.key).remove();
                db.ref("users/" + child.key + "/friends/" + currentUser.uid).remove();
            });

            // Block button
            const blockBtn = document.createElement("button");
            blockBtn.innerText = "Block";
            blockBtn.addEventListener("click", () => {
                db.ref("users/" + currentUser.uid + "/blocked/" + child.key).set(true);
                db.ref("users/" + currentUser.uid + "/friends/" + child.key).remove();
            });

            li.appendChild(removeBtn);
            li.appendChild(blockBtn);
            friendsListSettings.appendChild(li);
        });
    });

    // Show incoming friend requests
    const requestsRef = db.ref("friendRequests/" + currentUser.uid);
    requestsRef.off();
    requestsRef.on("value", snapshot => {
        snapshot.forEach(child => {
            if (child.val().status === "pending") {
                const li = document.createElement("li");
                li.innerText = `Request from ${child.val().from}`;

                const acceptBtn = document.createElement("button");
                acceptBtn.innerText = "Accept";
                acceptBtn.addEventListener("click", () => {
                    const friendUid = child.key;
                    db.ref("users/" + currentUser.uid + "/friends/" + friendUid).set({ email: child.val().from });
                    db.ref("users/" + friendUid + "/friends/" + currentUser.uid).set({ email: currentUser.email });
                    child.ref.remove();
                });

                const declineBtn = document.createElement("button");
                declineBtn.innerText = "Decline";
                declineBtn.addEventListener("click", () => child.ref.remove());

                li.appendChild(acceptBtn);
                li.appendChild(declineBtn);
                friendsListSettings.appendChild(li);
            }
        });
    });
}
