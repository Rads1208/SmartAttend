import { auth, storage, database } from "../assets/js/firebaseInit.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getDatabase, onValue, ref as dbRef, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "/login.html";
    } else {
        document.getElementById( "user-display-name").textContent = `Welcome, ${user.displayName || "User"}`;
        displayUserPhotos(user);
    }
});

async function displayUserPhotos(user) {
    const userDbRef = dbRef(database, `users/${user.uid}`);
    try {
        const snapshot = await get(userDbRef);
        if (snapshot.exists()) {
            const userData = snapshot.val();
            const photoPath = `user_photos/${userData.year}/${userData.class}/${userData.stream}/${userData.enrollmentNumber}/face_photo`;
            const photoRef = ref(storage, photoPath);
            const photosContainer = document.getElementById("uploaded-photos");
      
            try {
                const url = await getDownloadURL(photoRef);
                const img = document.createElement("img");
                img.src = url;
                img.classList.add("w-full", "h-auto", "rounded");
                photosContainer.appendChild(img);
            } catch (error) {
                console.error("Error fetching photo:", error);
            }
        } else {
            console.error("User data not found in the database");
        }
    } catch (error) {
        console.error("Error fetching user data from database:", error);
    }
}

const db = getDatabase();
var attendanceRef = dbRef(db, `Attendance/MTech/CSE/2024/MCS-401`); // change path
onValue(attendanceRef, (snapshot) => {
    const data = snapshot.val();
    const attendanceTable = document.getElementById("attendance-records");
    attendanceTable.innerHTML = "";
    if (data) {
        Object.keys(data).forEach((key) => {
            const record = data[key];
            const row = `<tr>
                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${record.enrollmentNumber}</td>
                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">MCS-401</td>
                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${record.timestamp}</td>
                </tr>`;
            attendanceTable.innerHTML += row;
        });
    } else {
        attendanceTable.innerHTML = "<tr><td colspan='6' class='text-center px-5 py-5 border-b border-gray-200 bg-white text-sm'>No attendance records found</td></tr>";
    }
});
      
window.logout = async () => {
    try {
        await signOut(auth);
        window.location.href = "./../login.html";
    } catch (error) {
        console.error("Logout Failed", error);
    }
};