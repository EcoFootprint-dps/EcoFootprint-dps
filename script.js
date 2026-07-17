// ==========================================
// SDG WEBATHON - JAVASCRIPT LOGIC
// Real-time Firebase Sync setup 
// Update: Claimed items now instantly VANISH from the board! 💨
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// our database config
const firebaseConfig = {
    apiKey: "AIzaSyBNO8SiOBW49CqL7YgHd572pF9mikE7ABo",
    authDomain: "ecofootprint-9c4ed.firebaseapp.com",
    projectId: "ecofootprint-9c4ed",
    storageBucket: "ecofootprint-9c4ed.firebasestorage.app",
    messagingSenderId: "425267033599",
    appId: "1:425267033599:web:3554770c24a204594ba3ca",
    measurementId: "G-NCNFZTHKS4"
};

// boot up firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================================
// 1. POLICY SIMULATOR LOGIC
// ==========================================
document.getElementById('footprintForm').addEventListener('submit', async function(e) {
    e.preventDefault(); // stops the annoying page reload

    let ans1 = Number(document.getElementById("q1").value);
    let ans2 = Number(document.getElementById("q2").value);
    let ans3 = Number(document.getElementById("q3").value);
    let ans4 = Number(document.getElementById("q4").value);
    let ans5 = Number(document.getElementById("q5").value);
    
    let finalPoints = ans1 + ans2 + ans3 + ans4 + ans5;

    // SENDING DATA: Save the score to the cloud
    try {
        await addDoc(collection(db, "simulatorScores"), {
            score: finalPoints,
            timeSaved: new Date().toISOString()
        });
    } catch (err) {
        console.log("DB error: ", err);
    }

    let feedbackBox = document.getElementById("feedbackText");
    let uiEmoji = "";
    let barHex = "";

    if (finalPoints >= 80) {
        uiEmoji = "🌍🏆";
        barHex = "#2ecc71"; // green
        feedbackBox.innerHTML = "🔥 INCREDIBLE! You implemented a true sustainable framework. By shifting to renewables and enforcing a circular economy, we can reach Net-Zero!";
        feedbackBox.style.color = "#27ae60"; 
    } else if (finalPoints >= 40 && finalPoints < 80) {
        uiEmoji = "⚠️📉";
        barHex = "#ffeb3b"; // yellow
        feedbackBox.innerHTML = "🌱 A GOOD START. But half-measures like EVs aren't enough. We need systemic shifts in agriculture and public transit. Try again!";
        feedbackBox.style.color = "#d35400"; 
    } else {
        uiEmoji = "🏭❌";
        barHex = "#ff5252"; // red
        feedbackBox.innerHTML = "🚨 DISASTER. Continuing the status quo guarantees severe global warming. We need radical policy shifts immediately.";
        feedbackBox.style.color = "#c0392b"; 
    }

    document.getElementById("resultEmoji").innerHTML = uiEmoji;
    document.getElementById('footprintForm').style.display = 'none';
    document.getElementById("resultBox").style.display = "block";

    // cool counting animation
    let tally = 0;
    document.getElementById("scoreDisplay").innerHTML = "0"; 
    
    let timer = setInterval(() => {
        if (tally >= finalPoints) {
            clearInterval(timer);
            document.getElementById("scoreDisplay").innerHTML = finalPoints; 
        } else {
            tally++;
            document.getElementById("scoreDisplay").innerHTML = tally;
        }
    }, 20); 

    setTimeout(() => {
        document.getElementById("scoreBarFill").style.width = finalPoints + "%";
        document.getElementById("scoreBarFill").style.backgroundColor = barHex;
    }, 100);
});

// ==========================================
// 2. REAL-TIME DATABASE SYNC (GIVE & TAKE)
// ==========================================

const boardDb = collection(db, "listedItems");
const sortQuery = query(boardDb, orderBy("timestamp", "desc"));

// GIVING DATA (REAL-TIME READ): This listens to Firestore 24/7.
onSnapshot(sortQuery, (snapshot) => {
    let htmlContainer = document.getElementById('give-take-cards');
    htmlContainer.innerHTML = ""; // clear old stuff
    
    let availableItemsCount = 0; // keep track to see if board is empty

    snapshot.forEach((docSnap) => {
        let itemData = docSnap.data();
        let docId = docSnap.id; 

        // 🔥 THE MAGIC FIX: If it is claimed, skip it completely!
        if (itemData.status === "claimed") {
            return; 
        }

        availableItemsCount++; // We found an available item!

        // build the HTML card dynamically
        let makeCard = `
            <div class="item-card" id="card-${docId}">
                <div class="card-icon">${itemData.icon}</div>
                <h3>${itemData.name}</h3>
                <p class="item-lister">Listed by: ${itemData.lister}</p>
                <p>${itemData.description}</p>
                <button class="claim-btn" id="btn-${docId}" onclick="claimItem('${docId}')">CLAIM FOR FREE</button>
            </div>
        `;
        htmlContainer.insertAdjacentHTML('beforeend', makeCard);
    });
    
    // If every single item was claimed, show a cool empty state message
    if (availableItemsCount === 0) {
        htmlContainer.innerHTML = "<h3 style='width:100%; text-align:center; color:#555;'>No items available right now. Be the first to list something! ♻️</h3>";
    }
});

// SENDING DATA: When someone lists a new item
document.getElementById('addItemForm').addEventListener('submit', async function(e) {
    e.preventDefault(); 

    let formBtn = document.querySelector(".add-btn");
    formBtn.innerHTML = "LISTING... ⏳";
    
    try {
        // pushing data to firestore
        await addDoc(collection(db, "listedItems"), {
            name: document.getElementById('newItemName').value,
            icon: document.getElementById('newItemIcon').value,
            lister: document.getElementById('newListerName').value,
            description: document.getElementById('newItemDesc').value,
            status: "available",
            timestamp: new Date().toISOString()
        });

        alert("📦 Item is live on the board!");
        document.getElementById('addItemForm').reset();

    } catch (err) {
        console.error("DB Upload Failed: ", err);
        alert("Network error.");
    } finally {
        formBtn.innerHTML = "LIST ITEM SECURELY 🔒";
    }
});

// UPDATING DATA: When someone clicks Claim
// UPDATING DATA: When someone clicks Claim
window.claimItem = async (docId) => {
    let card = document.getElementById("card-" + docId);
    let btn = document.getElementById("btn-" + docId);
    
    // 1. INSTANTLY VANISH THE CARD FROM THE SCREEN 💨
    // This bypasses the browser's alert pause and hides it immediately
    if (card) {
        card.style.opacity = "0";
        card.style.transform = "scale(0.9) translateY(20px)";
        
        // Wait for the quick transition animation to finish, then completely remove it from the layout
        setTimeout(() => {
            card.style.display = "none";
        }, 200);
    }

    try {
        // 2. UPDATE FIREBASE IN THE BACKGROUND
        const itemRef = doc(db, "listedItems", docId);
        await updateDoc(itemRef, {
            status: "claimed"
        });
        
        console.log("Item " + docId + " successfully updated to claimed in the cloud.");

    } catch (err) {
        console.error("Bro, the claim failed. Error: ", err);
        alert("Database error! Bringing the item back.");
        
        // If the database fails, bring the card back so the app doesn't glitch
        if (card) {
            card.style.display = "flex";
            card.style.opacity = "1";
            card.style.transform = "none";
        }
        if (btn) {
            btn.innerHTML = "CLAIM FOR FREE";
            btn.disabled = false;
        }
    }
};
window.resetQuiz = () => {
    document.getElementById("footprintForm").reset();
    document.getElementById("scoreDisplay").innerHTML = "0";
    document.getElementById("scoreBarFill").style.width = "0%";
    document.getElementById("resultBox").style.display = "none";
    document.getElementById("footprintForm").style.display = "block";
    document.getElementById('quiz').scrollIntoView({ behavior: 'smooth' });
};
