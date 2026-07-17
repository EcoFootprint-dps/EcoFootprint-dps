// ==========================================
// SDG WEBATHON - TEAM CODEGREENS (CLASS 9)
// JAVASCRIPT LOGIC FOR ECOFOOTPRINT RUNNING PROPERLY
// ==========================================

function calculateScore() {
    // Fetching values using old school DOM methods because querySelector was getting weird errors
    var q1Value = document.getElementById("q1").value;
    var q2Value = document.getElementById("q2").value;
    var q3Value = document.getElementById("q3").value;
    var q4Value = document.getElementById("q4").value;
    var q5Value = document.getElementById("q5").value;

    // VALIDATION ALERT!! Checks if the user left something blank because it ruins the math sum
    if (q1Value === "" || q2Value === "" || q3Value === "" || q4Value === "" || q5Value === "") {
        alert("🚨 WAIT A MINUTE! You missed a question! Please answer all 5 questions to save the Earth!");
        return; 
    }

    // Converting strings to real integers so we can actually add them together
    var score1 = parseInt(q1Value);
    var score2 = parseInt(q2Value);
    var score3 = parseInt(q3Value);
    var score4 = parseInt(q4Value);
    var score5 = parseInt(q5Value);

    // Super simple formula we calculated ourselves
    var totalScore = score1 + score2 + score3 + score4 + score5;

    // Grab the elements to push output data
    var scoreDisplay = document.getElementById("scoreDisplay");
    var feedbackText = document.getElementById("feedbackText");
    var resultBox = document.getElementById("resultBox");

    scoreDisplay.innerHTML = totalScore;

    // IF-ELSE CHAINS FOR CUSTOM ALERTS BASED ON PERFORMANCE
    if (totalScore >= 40) {
        feedbackText.innerHTML = "🚨 YIKES! Your carbon footprint is massive! You are consuming way too much energy and producing massive waste. You need to start walking to school, eating fewer burgers, and turning off your electronics right now!!!";
        feedbackText.style.color = "#c0392b"; // Red warning color
    } else if (totalScore >= 20 && totalScore < 40) {
        feedbackText.innerHTML = "⚠️ NOT BAD, BUT YOU CAN DO BETTER! You have average habits, but the planet needs heroes, not average citizens! Try to cut down your shower times and reuse your plastic items more often.";
        feedbackText.style.color = "#d35400"; // Orange color
    } else {
        feedbackText.innerHTML = "🌿 WOW!!! YOU ARE A GENUINE ECO-HERO! Your score is super low. The Earth absolutely loves you. Keep doing exactly what you are doing and teach your friends to do the same! 🤜🤛";
        feedbackText.style.color = "#27ae60"; // Green color
    }

    // Unhiding the box completely so the student can see their custom feedback
    resultBox.style.display = "block";
}

// Resetting the form here because it glitched out earlier and didn't clear selection values properly
function resetQuiz() {
    document.getElementById("footprintForm").reset();
    document.getElementById("resultBox").style.display = "none";
}
