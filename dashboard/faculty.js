import { auth, storage } from "../assets/js/firebaseInit.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, query, orderByChild, equalTo, onValue, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { ref as storageRef, uploadBytesResumable } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

document.getElementById("show-add-subject-form").addEventListener("click", ShowSubjectAddForm)
document.getElementById("show-manual-attendance-form").addEventListener("click", ShowManualAttendanceForm)

document.getElementById("subject-add-form").addEventListener("submit", function(event){AddSubject(event)})
document.getElementById("manual-attendance-form").addEventListener('submit', function(event){ManualMarkAttendance(event)})
document.getElementById("upload-video").addEventListener("click", function(event){AutomaticMarkAttendance(event)})
document.getElementById("aams-subject-code").addEventListener("click", function(event){getSubjectsAAMS(event)});

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
      manual_attendance_button.classList.remove("hidden");

      const teacherName = document.getElementById("teacher-name").value;

      const db = getDatabase();
      var subjectRef = ref(db, `Subjects`);
      onValue(subjectRef, (snapshot) => {
        const data = snapshot.val();
        document.getElementById("manual-subject").addEventListener("click", function(){
          const year = document.getElementById("manual-year").value;
          const degree = document.getElementById("manual-ed-degree").value;
          const stream = document.getElementById("manual-stream").value;

          for(const subject in data[degree][stream][year][teacherName]){
            console.log(subject);
            document.getElementById("manual-subject").innerHTML += `<option value="${subject}">${subject}</option>`;
          }
        })
      });
    }
    else{
      manual_attendance_button.classList.add("hidden")
    }
}

function ManualMarkAttendance(event){
    event.preventDefault();

    const subject = document.getElementById("manual-subject").value;
    const enrollmentNumber = document.getElementById("manual-student-enrollment-number").value;
    const year = document.getElementById("manual-year").value;
    const degree = document.getElementById("manual-ed-degree").value;
    const stream = document.getElementById("manual-stream").value;
    const teacherName = document.getElementById("teacher-name").value;
    
    // Mark Attendance in Backend Manually
    fetch(`https://smartattend-6da73-default-rtdb.firebaseio.com/Attendance/${degree}/${stream}/${year}/${teacherName}/${subject}.json`, {
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
    }

    showAttendanceRecords(user.displayName);
});

function showAttendanceRecords(teacherName){
  const attendanceTable = document.getElementById("attendance-records");
  attendanceTable.innerHTML = "";

  const db = getDatabase();
  var attendanceRef = ref(db, `Attendance/`);

  onValue(attendanceRef, (snapshot) => {
    const data = snapshot.val();
    if (data){
      for (const degree in data){
        for (const stream in data[degree]){
          for (const year in data[degree][stream]){
            for (const teacher in data[degree][stream][year]){
              if (teacher == teacherName){
                for (const subject in data[degree][stream][year][teacher]){
                  for (const key in data[degree][stream][year][teacher][subject]){
                    const record = data[degree][stream][year][teacher][subject][key];
                    if (record.enrollmentNumber != undefined){
                      const row = `<tr>
                        <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${degree}</td>
                        <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${stream}</td>
                        <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${year}</td>
                        <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${subject}</td>
                        <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${record.enrollmentNumber}</td>
                        <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${record.timestamp}</td>
                        </tr>`;
                      attendanceTable.innerHTML += row;
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else{
      attendanceTable.innerHTML = "<tr><td colspan='6' class='text-center px-5 py-5 border-b border-gray-200 bg-white text-sm'>No attendance records found</td></tr>";
    }
  }); 
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return (
      date.toLocaleDateString("en-US") +
      " " +
      date.toLocaleTimeString("en-US")
    );
}

function getSubjectsAAMS(event){
  document.getElementById("aams-subject-code").innerHTML = "";
  const year = document.getElementById("aams-year").value;
  const degree = document.getElementById("aams-ed-degree").value;
  const stream = document.getElementById("aams-stream").value;
  const teacherName = document.getElementById("teacher-name").value;

  const db = getDatabase();
  var subjectRef = ref(db, `Subjects/${degree}/${stream}/${year}/${teacherName}`);

  onValue(subjectRef, (snapshot) => {
    const data = snapshot.val();
    for(const subject in data){
        document.getElementById("aams-subject-code").innerHTML += `<option value="${subject}">${subject}</option>`;
      }
    })
}

window.logout = async () => {
    try {
        await signOut(auth);
        window.location.href = "./../login.html";
    } catch (error) {
        console.error("Logout Failed", error);
    }
};
