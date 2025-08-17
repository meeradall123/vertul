// ================= Firebase Init =================
const firebaseConfig = { /* YOUR FIREBASE CONFIG HERE */ };
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
let uid;

auth.onAuthStateChanged(user => {
    if(!user) window.location.href = "login.html";
    else uid = user.uid;
    loadProfile();
    loadFriends();
});

// ================= Load Profile =================
function loadProfile() {
    db.ref("users/" + uid).once("value").then(snap => {
        const user = snap.val();
        document.getElementById("newUsername").value = user.username;
        document.getElementById("newAvatar").value = user.avatar;
    });
}

// ================= Update Profile =================
document.getElementById("updateProfileBtn").addEventListener("click", () => {
    const username = document.getElementById("newUsername").value.trim();
    const avatar = document.getElementById("newAvatar").value.trim();
    const updates = {};
    if(username) updates.username = username;
    if(avatar) updates.avatar = avatar;
    db.ref("users/" + uid).update(updates)
        .then(() => alert("Profile updated!"))
        .catch(err => alert(err.message));
});

// ================= Change Password =================
document.getElementById("changePasswordBtn").addEventListener("click", () => {
    const newPass = document.getElementById("newPassword").value.trim();
    if(!newPass) return alert("Enter password");
    auth.currentUser.updatePassword(newPass)
        .then(()=>alert("Password changed!"))
        .catch(err=>alert(err.message));
});

// ================= Dark Mode =================
document.getElementById("darkModeBtn").addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
});

// ================= Friends System =================
function loadFriends() {
    db.ref("users").on("value", snap => {
        const users = snap.val();
        const list = document.getElementById("friendsListSettings");
        list.innerHTML = "";
        for(let id in users){
            if(id === uid) continue;
            const user = users[id];
            list.innerHTML += `<li>${user.username} (${user.status}) <button onclick="removeFriend('${id}')">Remove</button></li>`;
        }
    });
}

document.getElementById("addFriendBtn").addEventListener("click", () => {
    const email = document.getElementById("friendEmail").value.trim();
    if(!email) return alert("Enter email");
    db.ref("users").orderByChild("email").equalTo(email).once("value")
        .then(snap => {
            if(snap.exists()){
                const friendId = Object.keys(snap.val())[0];
                db.ref("friends/" + uid + "/" + friendId).set("pending");
                alert("Friend request sent!");
            } else alert("User not found");
        });
});

function removeFriend(friendId){
    db.ref("friends/" + uid + "/" + friendId).remove();
    alert("Friend removed!");
}

// ================= Logout =================
document.getElementById("logoutBtn").addEventListener("click", () => {
    auth.signOut().then(()=>window.location.href="login.html");
});
