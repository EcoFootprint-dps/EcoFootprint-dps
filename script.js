import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js"; /* this works finally */
import{getFirestore,collection,addDoc,onSnapshot,query,orderBy,updateDoc,doc,serverTimestamp}from"https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* DO NOT TOUCH THE CONFIG OR THE DB EXPLODES */
var conf = {apiKey:"AIzaSyBNO8SiOBW49CqL7YgHd572pF9mikE7ABo",authDomain:"ecofootprint-9c4ed.firebaseapp.com",projectId:"ecofootprint-9c4ed",storageBucket:"ecofootprint-9c4ed.firebasestorage.app",messagingSenderId:"425267033599",appId:"1:425267033599:web:3554770c24a204594ba3ca",measurementId:"G-NCNFZTHKS4"};
var firebaseApp=initializeApp(conf);
var database = getFirestore(firebaseApp);

/* security stuff from stackoverflow */
function cln(s){
  if(!s)return"";
  var d=document.createElement('div');
  d.textContent=s;
  return d.innerHTML;
}

/* putting everything in onload because it broke otherwise */
window.onload = function() {
  
  /* --- NEW STUFF: Electricity Maps API Magic (Now with visual meter!) --- */
  var fetchCarbonIntensity = async function(zone) {
      var valDisplay = document.getElementById("intensityValue");
      var meterFill = document.getElementById("intensityMeterFill");
      var statusDisplay = document.getElementById("intensityStatus");
      
      valDisplay.innerText = "Loading...";
      if(meterFill) meterFill.style.width = "0%";
      if(statusDisplay) {
          statusDisplay.innerText = "Checking grid health...";
          statusDisplay.style.color = "gray";
      }

      try {
          var res = await fetch("https://api.electricitymaps.com/v3/carbon-intensity/latest?zone=" + zone, {
              method: "GET",
              headers: {
                  "auth-token": "em_n3XyWvGUmEEhaaM7Qs9p4weDVx9yVMeJ"
              }
          });
          
          if (!res.ok) {
              var errTxt = await res.text();
              console.error("🚨 API Server Error:", errTxt);
              throw new Error("HTTP Status " + res.status);
          }
          
          var data = await res.json();
          
          if (data && data.carbonIntensity !== undefined && data.carbonIntensity !== null) {
              var intensity = data.carbonIntensity;
              valDisplay.innerText = intensity;
              
              /* Visual meter math (assuming 800 is the absolute dirtiest grid for our scale) */
              if(meterFill && statusDisplay) {
                  var pct = Math.min((intensity / 800) * 100, 100);
                  meterFill.style.width = pct + "%";
                  
                  /* Judging the local power grid */
                  if(intensity < 250) {
                      meterFill.style.backgroundColor = "var(--green)";
                      statusDisplay.innerText = "Grid is looking clean today! 🌿";
                      statusDisplay.style.color = "var(--green)";
                  } else if(intensity < 550) {
                      meterFill.style.backgroundColor = "var(--yellow)";
                      statusDisplay.innerText = "Moderate emissions. Meh. 🤷‍♂️";
                      statusDisplay.style.color = "var(--yellow)";
                  } else {
                      meterFill.style.backgroundColor = "var(--orange)";
                      statusDisplay.innerText = "Grid is literally coughing smog. 🏭";
                      statusDisplay.style.color = "var(--orange)";
                  }
              }
          } else {
              valDisplay.innerText = "--"; 
              if(statusDisplay) statusDisplay.innerText = "Region data offline 💀";
              console.warn("⚠️ API returned empty data for this zone:", data);
          }
      } catch (err) {
          console.error("🚨 Electricity API completely failed: ", err.message);
          valDisplay.innerText = "N/A";
          if(statusDisplay) statusDisplay.innerText = "API Blocked by School WiFi 😭";
      }
  };

  /* hook up the dropdown so it updates automatically */
  var regionDrop = document.getElementById("regionSelect");
  if (regionDrop) {
      regionDrop.addEventListener("change", function(e) {
          fetchCarbonIntensity(e.target.value);
      });
      fetchCarbonIntensity(regionDrop.value);
  }
  /* --- END OF NEW API STUFF --- */


  /* quiz section logic */
  document.getElementById("footprintForm").onsubmit = function(e) {
    e.preventDefault(); 
    
    var v1=document.getElementById('q1').value*1;
    var v2=document.getElementById('q2').value*1;
    var v3=document.getElementById('q3').value*1;
    var v4=document.getElementById('q4').value*1;
    var v5=document.getElementById('q5').value*1;

    var summ = 0;
    summ = v1+v2+v3+v4+v5;

    addDoc(collection(database, 'simulatorScores'), { score: summ, date: serverTimestamp() }).then(function(){
    }).catch(function(err){
        console.log("bruh error wtf: " + err); 
    });

    var fb = document.getElementById("feedbackText");
    var emj = ""; var col = "";

    if(summ>79){
        emj="🌍"; col="green";
        fb.innerText="🔥 INCREDIBLE! You implemented a true sustainable framework. By shifting to renewables and enforcing a circular economy, we can reach Net-Zero!";
        fb.style.color="green";
    }else{
        if(summ>39 && summ<80){
            emj="⚠️"; col="orange";
            fb.innerText="🌱 A GOOD START. But half-measures aren't enough. We need systemic shifts in lots of things. Try again!";
            fb.style.color="orange";
        }else{
            emj="❌"; col="red";
            fb.innerText="🚨 DISASTER. Continuing the status quo guarantees severe global warming. We need massive policy shifts immediately.";
            fb.style.color="red";
        }
    }

    document.getElementById("resultEmoji").innerText = emj; 
    document.getElementById('footprintForm').style.display='none';
    document.getElementById("resultBox").style.display='block';

    var c=0;
    document.getElementById("scoreText").innerText="0";

    var tmr = setInterval(function(){
        if(c>=summ){
            clearInterval(tmr); 
            document.getElementById("scoreText").innerText=summ;
        }else{
            c++;
            document.getElementById("scoreText").innerText=c;
        }
    }, 20); 

    setTimeout(function(){
        document.getElementById("barFill").style.width=summ+"%";
        document.getElementById("barFill").style.backgroundColor=col;
    }, 150); 
  };

  /* board stuff */
  var refs = collection(database, "listedItems");
  var qqq = query(refs, orderBy("timestamp", "desc")); 

  onSnapshot(qqq, function(s) {
      var b = document.getElementById('live-board');
      var l = document.getElementById('claimed-list');
      
      b.innerHTML=""; l.innerHTML=""; 
      var i_c=0; var c_c=0;

      s.forEach(function(d){
          var o = d.data();
          var iid = d.id;
          
          var n1 = cln(o.name);
          var c2 = cln(o.claimedBy);
          var l3 = cln(o.lister);
          var d4 = cln(o.description);

          if(o.status=="claimed"){
              c_c++;
              l.innerHTML = l.innerHTML + "<li>✅ <strong>"+n1+"</strong> was snagged by "+c2+"!</li>";
          }else{
              i_c++;
              var html = "";
              html += "<div class='item-card' id='card-"+iid+"'>";
              html += "<div class='card-icon'>"+o.icon+"</div>";
              html += "<h3>"+n1+"</h3>";
              html += "<p class='lister-name'>Listed by: "+l3+"</p>";
              html += "<p>"+d4+"</p>";
              html += "<button class='grab-btn' id='btn-"+iid+"' onclick='claimIt(\""+iid+"\")'>CLAIM FOR FREE</button>";
              html += "</div>";
              b.innerHTML += html;
          }
      });

      var el = document.getElementById('landfillCounter');
      if(el){ el.innerText=c_c; }

      if(i_c==0){
          b.innerHTML="<h3 style='width:100%;text-align:center;color:gray;'>No items available right now. Be the first to list something!</h3>";
      }
      if(c_c==0){
          l.innerHTML="<li>No items claimed yet... be the first!</li>";
      }
  });

  document.getElementById('addItemForm').onsubmit = function(ev) {
      ev.preventDefault();
      var btn = document.querySelector(".post-btn");
      var txt = btn.innerText;
      btn.innerText="UPLOADING..."; 

      var n = document.getElementById('newItemName').value;
      var i = document.getElementById('newItemIcon').value;
      var lst = document.getElementById('newListerName').value;
      var desc = document.getElementById('newItemDesc').value;

      addDoc(collection(database, "listedItems"), {
          name: n, icon: i, lister: lst, description: desc, status: "available", timestamp: serverTimestamp()
      }).then(function(){
          alert("It's live on the board! (unless the wifi blocked it)");
          document.getElementById('addItemForm').reset();
          btn.innerText=txt;
      }).catch(function(e){
          console.log(e);
          alert("network error bro, our school blocklist probably blocked firebase again smh");
          btn.innerText=txt;
      });
  };
};

window.claimIt = function(id) {
    var un = prompt("♻️ Awesome! Enter your name & class so the owner knows who to give it to: (separate by comma)");
    if(un=="" || un==null){return;} 

    var btn = document.getElementById("btn-"+id);
    if(btn){
        btn.innerText="CLAIMED!";
        btn.style.background="green";
        btn.disabled=true; 
    }

    setTimeout(function(){
        updateDoc(doc(database, "listedItems", id), {
            status:"claimed",
            claimedBy: un
        }).catch(function(e){
            console.log(e);
            alert("🚨 ERROR: Couldn't connect to server! Try turning off your VPN maybe?");
            if(btn){
                btn.innerText="CLAIM FOR FREE";
                btn.style.background="";
                btn.disabled=false; 
            }
        });
    }, 800);
};

window.resetQuiz = function() {
    document.getElementById("footprintForm").reset();
    document.getElementById("scoreText").innerText="0";
    document.getElementById("barFill").style.width="0%";
    document.getElementById("resultBox").style.display="none";
    document.getElementById("footprintForm").style.display="block"; 
    window.scrollTo(0, document.getElementById('sim').offsetTop); 
};

window.activateWinnerProtocol = function() {
    document.body.className += " winner-mode";
    var b = document.createElement('div');
    b.className = 'victory-banner';
    b.innerHTML = '<h1 style="font-size: 8rem; color: #ffd700; text-shadow: 10px 10px 0px black;">WINNERS! 🏆</h1>';
    document.body.appendChild(b);
    
    setTimeout(function(){
        b.remove();
        document.body.classList.remove('winner-mode');
    }, 3000);
    console.log("Judges: 'Wow, such clean code.'");
};
