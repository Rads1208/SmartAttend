import { auth, storage, database } from "../assets/js/firebaseInit.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getDatabase, onValue, ref as dbRef, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

document.getElementById("show-subject-register-form").addEventListener("click", ShowSubjectRegisterForm);
document.getElementById("subject-register-form").addEventListener("submit", function(event){SubjectRegisterForm(event)});

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "/login.html";
    } else {
        document.getElementById( "user-display-name").textContent = `Welcome, ${user.displayName || "User"}`;
        displayUserPhotos(user);
        document.getElementById("user-uid").value = user.uid;
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

            document.getElementById("year").value = userData.year;
            document.getElementById("ed-degree").value = userData.class.replace('.', '');
            document.getElementById("stream").value = userData.stream;
            document.getElementById("enrollment-number").value = userData.enrollmentNumber;
      
            try {
                const url = await getDownloadURL(photoRef);
                const img = document.createElement("img");
                img.src = url;
                img.classList.add("w-full", "h-auto", "rounded");
                photosContainer.appendChild(img);
            } catch (error) {
                console.error("Error fetching photo:", error);
            }

            // calling show attendance records data

            showAttendanceRecords(userData.year, userData.class.replace('.', ''), userData.stream, userData.enrollmentNumber);
        } else {
            console.error("User data not found in the database");
        }
    } catch (error) {
        console.error("Error fetching user data from database:", error);
    }
}

function showAttendanceRecords(year, degree, stream, enrollmentNumber){
    const db = getDatabase();
    var attendanceRef = dbRef(db, `Attendance/${degree}/${stream}/${year}`); // change path
    onValue(attendanceRef, (snapshot) => {
        const data = snapshot.val();
        const attendanceTable = document.getElementById("attendance-records");
        attendanceTable.innerHTML = "";

        if (data){
            for(const teacher in data){
                for(const subject in data[teacher]){
                    const subDetails = subject.split(" ");
                    
                    const subjectCode = subDetails[0];
                    const subjectCredits = subDetails[subDetails.length - 1];
                    var subjectName = "";
                    for (let i = 1 ; i < subDetails.length - 1 ; i++){
                        subjectName += subDetails[i] + " ";
                    }

                    for(const key in data[teacher][subject]){
                        if(data[teacher][subject][key].enrollmentNumber == enrollmentNumber){
                            const record = data[teacher][subject][key];
                            if (record.enrollmentNumber != undefined){
                                const row = `<tr>
                                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${record.enrollmentNumber}</td>
                                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${subjectCode}</td>
                                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${subjectName}</td>
                                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${subjectCredits}</td>
                                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${record.timestamp}</td>
                                    </tr>`;
                                attendanceTable.innerHTML += row;
                            }
                        }
                    }
                }
            }
        } else {
            attendanceTable.innerHTML = "<tr><td colspan='5' class='text-center px-5 py-5 border-b border-gray-200 bg-white text-sm'>No attendance records found</td></tr>";
        }
    });
}
      
window.logout = async () => {
    try {
        await signOut(auth);
        window.location.href = "./../login.html";
    } catch (error) {
        console.error("Logout Failed", error);
    }
};

function ShowSubjectRegisterForm(){
    let subject_add_button = document.getElementById("subject-register-form")
    if(subject_add_button.classList.contains("hidden")){
        subject_add_button.classList.remove("hidden");

        const year = document.getElementById("year").value;
        const degree = document.getElementById("ed-degree").value;
        const stream = document.getElementById("stream").value;

        const db = getDatabase();
        var subjectRef = dbRef(db, `Subjects/${degree}/${stream}/${year}`);
        onValue(subjectRef, (snapshot) => {
            const data = snapshot.val();
            for (const key in data) {
                document.getElementById("teacher-name").innerHTML += `<option value="${key}">${key}</option>`;
                document.getElementById("teacher-name").addEventListener("click", function(event){
                    document.getElementById("subject").innerHTML = `<option value="">Select Subject</option>`;
                    const teacher = document.getElementById("teacher-name").value;
                    // console.log(teacher);
                    for (const subject in data[teacher]){
                        document.getElementById("subject").innerHTML += `<option value="${subject}">${subject}</option>`;
                    }
                })
            }
        });
    }
    else{
      subject_add_button.classList.add("hidden")
    }
}

function SubjectRegisterForm(event){
    event.preventDefault();
    const year = document.getElementById("year").value;
    const degree = document.getElementById("ed-degree").value;
    const stream = document.getElementById("stream").value;
    const subject = document.getElementById("subject").value;
    const userUid = document.getElementById("user-uid").value;
    const userEnrollmentNumber = document.getElementById("enrollment-number").value;
    const teacherName = document.getElementById("teacher-name").value;

    // Add subject to firebase
    fetch(`https://smartattend-6da73-default-rtdb.firebaseio.com/Subjects/${degree}/${stream}/${year}/${teacherName}/${subject}/Students.json`, {
        method: "POST",
        body: JSON.stringify(
        {
            studentUid: userUid,
            studentEnrollmentNumber: userEnrollmentNumber
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    });

    document.getElementById("subject-register-form").classList.add("hidden")

    let display_output = document.getElementById("output");
    display_output.innerText = "Subject Registered"
}
