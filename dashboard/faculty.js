import { auth, storage } from "../assets/js/firebaseInit.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, query, orderByChild, equalTo, onValue, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { ref as storageRef, uploadBytesResumable } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

document.getElementById("show-add-subject-form").addEventListener("click", ShowSubjectAddForm)
document.getElementById("show-manual-attendance-form").addEventListener("click", ShowManualAttendanceForm)

document.getElementById("subject-add-form").addEventListener("submit", function(event){AddSubject(event)})
document.getElementById("manual-attendance-form").addEventListener('submit', function(event){ManualMarkAttendance(event)})
document.getElementById("upload-video").addEventListener("click", function(event){AutomaticMarkAttendance(event)})

function ShowSubjectAddForm(){
    let subject_add_button = document.getElementById("subject-add-form")
    if(subject_add_button.classList.contains("hidden")){
      subject_add_button.classList.remove("hidden")
    }
    else{
      subject_add_button.classList.add("hidden")
    }
}

function AddSubject(event){
    event.preventDefault();
    const year = document.getElementById("year").value;
    const degree = document.getElementById("ed-degree").value;
    const stream = document.getElementById("stream").value;
    const subjectCode = document.getElementById("subject-code").value;
    const subjectName = document.getElementById("subject-name").value;
    const subjectCredits = document.getElementById("subject-credits").value;
    const teacherName = document.getElementById("teacher-name").value;
    
    // Add subject to firebase
    fetch(`https://smartattend-6da73-default-rtdb.firebaseio.com/Subjects/${degree}/${stream}/${year}/${teacherName}/${subjectCode} ${subjectName} ${subjectCredits}.json`, {
        method: "POST",
        body: JSON.stringify('Subject Added'),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    });

    document.getElementById("subject-add-form").classList.add("hidden")

    let display_output = document.getElementById("output");
    display_output.innerText = "Subject Added"
}

function ShowManualAttendanceForm(){
    let manual_attendance_button = document.getElementById("manual-attendance-form")
    if(manual_attendance_button.classList.contains("hidden")){
      manual_attendance_button.classList.remove("hidden")
    }
    else{
      manual_attendance_button.classList.add("hidden")
    }
}

function ManualMarkAttendance(event){
    event.preventDefault();

    const subject = document.getElementById("manual-subject-code").value;
    const enrollmentNumber = document.getElementById("manual-student-enrollment-number").value;
    const year = document.getElementById("manual-year").value;
    const degree = document.getElementById("manual-ed-degree").value;
    const stream = document.getElementById("manual-stream").value;
    const teacherName = document.getElementById("teacher-name").value;
    
    // Mark Attendance in Backend Manually
    fetch(`https://smartattend-6da73-default-rtdb.firebaseio.com/Attendance/${degree}/${stream}/${year}/${subject}/${teacherName}.json`, {
        method: "POST",
        body: JSON.stringify({
            enrollmentNumber: enrollmentNumber,
            timestamp: '-'
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    });

    document.getElementById("manual-attendance-form").classList.add("hidden")
    let display_output = document.getElementById("output");
    display_output.innerText = "Attendance Granted"
}

async function AutomaticMarkAttendance(event){
    event.preventDefault();

    const year = document.getElementById("aams-year").value;
    const degree = document.getElementById("aams-ed-degree").value;
    const stream = document.getElementById("aams-stream").value;
    const subject = document.getElementById("aams-subject-code").value;
    const video = document.getElementById("aams-video").files[0];
    const timestamp = new Date().toString();

    // Save Snapshot in cloud storage

    try{
        const videoRef = storageRef(storage, `class_snapshots/${degree}/${stream}/${year}/${subject}/${timestamp}`);
        const uploadTask = uploadBytesResumable(videoRef, video);

        await new Promise((resolve, reject) => {
            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(progress)
                },
                (error) => reject(error),
                () => resolve()
            );
        });
    }
    catch(e){
        console.log("error: ", e)
    }

    // Mark Automatic Attendance in Backend using Video - FR

    let display_output = document.getElementById("output");
    display_output.innerText = "Attendance Marked Successfully"
}

// Old Script

onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "/login.html";
    } else {
      document.getElementById(
        "user-display-name"
      ).textContent = `Welcome, ${user.displayName || "User"}`;

      if (user.displayName != null){
        document.getElementById("teacher-name").value = user.displayName;
      }
      else{
        document.getElementById("teacher-name").value = "Unknown Teacher";
      }

      const db = getDatabase();
      var attendanceRef = ref(db, `Attendance/MTech/CSE/2024/MCS-401`); // change path
      onValue(attendanceRef, (snapshot) => {
        const data = snapshot.val();
        console.log(data)
        const attendanceTable = document.getElementById("attendance-records");
        attendanceTable.innerHTML = "";
        if (data) {
          Object.keys(data).forEach((key) => {
            const record = data[key];
            const row = `<tr>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${record.enrollmentNumber}</td>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">MTech</td>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">CSE</td>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">2020</td>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">MCS-401</td>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${record.timestamp}</td>
            </tr>`;
            attendanceTable.innerHTML += row;
          });
        } else {
          attendanceTable.innerHTML =
            "<tr><td colspan='6' class='text-center px-5 py-5 border-b border-gray-200 bg-white text-sm'>No attendance records found</td></tr>";
        }
      });
    }
  });

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return (
      date.toLocaleDateString("en-US") +
      " " +
      date.toLocaleTimeString("en-US")
    );
}

window.logout = async () => {
    try {
        await signOut(auth);
        window.location.href = "./../login.html";
    } catch (error) {
        console.error("Logout Failed", error);
    }
};
