function addComplaint(){
    const input=document.getElementById("complaintInput");
    const value=input.value.trim();
    if(!value)return;
    addListItem("complaintList",value);
    input.value="";
}

function addFinding(){
    const input=document.getElementById("findingInput");
    const value=input.value.trim();
    if(!value)return;
    addListItem("findingList",value);
    input.value="";
}

function addTest(){
    const input=document.getElementById("testInput");
    const value=input.value.trim();
    if(!value)return;
    addListItem("testList",value);
    input.value="";
    updateSelectedTests();
}

function addHistory(inputId,listId){
    const input=document.getElementById(inputId);
    const value=input.value.trim();
    if(!value)return;
    addListItem(listId,value);
    input.value="";
}

function addSuggested(listId,text){
    const list=document.getElementById(listId);
    if(!list)return;
    const exists=[...list.querySelectorAll('li span')].some(el=>el.textContent.replace(/^•\s*/, '').trim().toLowerCase()===text.toLowerCase());
    if(exists)return;
    addListItem(listId,text);
}

function addListItem(id,text){
    const list=document.getElementById(id);
    if(!list)return;
    const li=document.createElement("li");
    li.innerHTML=`<span>• ${escapeHtml(text)}</span><button type="button" class="remove" onclick="this.parentElement.remove();updatePrintState()">⊗</button>`;
    list.appendChild(li);
    updatePrintState();
}

function updateSelectedTests(){
    const box=document.getElementById("selectedTests");
    if(!box)return;
    box.innerHTML="";

    // Selected checkbox investigations
    document.querySelectorAll('.test-grid input[type="checkbox"]:checked').forEach(cb=>{
        const div=document.createElement("div");
        div.className="selected-test";
        div.textContent="• " + cb.value;
        box.appendChild(div);
    });

    // Custom investigations added through the input
    document.querySelectorAll('#testList li span').forEach(span=>{
        const text=span.textContent.replace(/^•\s*/, '').trim();
        if(!text)return;
        const div=document.createElement("div");
        div.className="selected-test";
        div.textContent="• " + text;
        box.appendChild(div);
    });

    updatePrintState();
}

document.addEventListener("change",e=>{
    if(e.target.matches('.test-grid input[type="checkbox"]'))updateSelectedTests();
});

function addMedicine(){
    const name=document.getElementById("medicineName").value.trim();
    if(!name){
        document.getElementById("medicineName").focus();
        return;
    }

    const doseParts=["dose1","dose2","dose3"].map(id=>document.getElementById(id)?.value.trim() ?? "");
    const dose=doseParts.some(Boolean)?doseParts.map(v=>v||"0").join("+"):"-";
    const timing=document.getElementById("medicineTiming").value;
    const duration=document.getElementById("medicineDuration").value.trim()||"-";
    const note=document.getElementById("medicineNote").value.trim();
    const list=document.getElementById("medicineList");

    const card=document.createElement("div");
    card.className="medicine-card";
    card.innerHTML=`
      <div class="num">${list.children.length+1}.</div>
      <div><div class="drug-title">${escapeHtml(name)}</div>${note?`<small>${escapeHtml(note)}</small>`:""}</div>
      <div>${escapeHtml(dose)}</div>
      <div>${escapeHtml(timing)}<br><small>${escapeHtml(duration)}</small></div>
      <button type="button" class="delete-drug" onclick="this.parentElement.remove();renumber();updatePrintState()">Remove</button>`;
    list.appendChild(card);

    document.getElementById("medicineName").value="";
    ["dose1","dose2","dose3"].forEach(id=>{const el=document.getElementById(id);if(el)el.value="";});
    document.getElementById("medicineNote").value="";
    document.getElementById("medicineDuration").value="";
    updatePrintState();
}

function renumber(){
    document.querySelectorAll("#medicineList .num").forEach((el,i)=>el.textContent=(i+1)+".");
}

function escapeHtml(str){
    return String(str).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

function clearForm(){
    if(!confirm("Clear all entered information?"))return;
    document.querySelectorAll("input, textarea, select").forEach(el=>{
        if(!el.closest(".doctor-block")&&!el.closest(".clinic-block")){
            if(el.type==="checkbox")el.checked=false;
            else if(el.type==="radio")el.checked=false;
            else if(el.type!=="date")el.value="";
        }
    });
    document.querySelectorAll(".editable").forEach(el=>el.innerHTML="");
    ["complaintList","findingList","testList","pdhList","mhList","medicineList"].forEach(id=>{
        const el=document.getElementById(id);if(el)el.innerHTML="";
    });
    updateSelectedTests();
    document.getElementById("patientDate").valueAsDate=new Date();
    updatePrintState();
}

/* ---------------- Keyboard fast-entry ---------------- */
function focusNext(elements,current){
    const index=elements.indexOf(current);
    if(index<0)return false;
    for(let i=index+1;i<elements.length;i++){
        const next=elements[i];
        if(next && !next.disabled && next.offsetParent!==null){
            next.focus();
            if(next.select && next.tagName==="INPUT" && next.type!=="date")next.select();
            return true;
        }
    }
    return false;
}

function headerEditableEnter(el){
    const fields=[...document.querySelectorAll(".rx-header .editable")];
    return focusNext(fields,el);
}

function handleMedicineEnter(e){
    const order=[
        "medicineName","dose1","dose2","dose3","medicineTiming","medicineDuration","medicineNote"
    ].map(id=>document.getElementById(id)).filter(Boolean);
    const current=e.target;
    const index=order.indexOf(current);
    if(index<0)return;

    e.preventDefault();

    if(current.id==="medicineNote"){
        addMedicine();
        document.getElementById("medicineName")?.focus();
        return;
    }

    const next=order[index+1];
    if(next){
        next.focus();
        if(next.select && next.tagName==="INPUT" && next.type!=="date")next.select();
    }
}

function updatePrintState(){
    const temp=document.getElementById("temp");
    const bp1=document.getElementById("bp1");
    const bp2=document.getElementById("bp2");
    const pulse=document.getElementById("pulse");
    const others=document.getElementById("others");
    const set=(id,empty)=>{
        const el=document.querySelector(`[data-vital="${id}"]`);
        if(el)el.classList.toggle("print-empty",empty);
    };
    set("temp",!(temp?.value.trim()));
    set("bp",!(bp1?.value.trim()||bp2?.value.trim()));
    set("pulse",!(pulse?.value.trim()));
    const othersEmpty=!(others?.value.trim());
    const othersLabel=document.querySelector('[data-vital="others"]');
    const othersText=document.querySelector('[data-vital="othersText"]');
    othersLabel?.classList.toggle("print-empty",othersEmpty);
    othersText?.classList.toggle("print-empty",othersEmpty);

    const cardStates=[
        [document.querySelector('#complaintList')?.closest('.side-card'),!!document.querySelector('#complaintList li')],
        [document.querySelector('#mhList')?.closest('.side-card'),!!document.querySelector('#mhList li')],
        [document.querySelector('#pdhList')?.closest('.side-card'),!!document.querySelector('#pdhList li')],
        [document.querySelector('#findingList')?.closest('.side-card'),!!document.querySelector('#findingList li')||!!(temp?.value.trim()||bp1?.value.trim()||bp2?.value.trim()||pulse?.value.trim()||others?.value.trim())],
        [document.querySelector('.tests-card'),!!document.querySelector('#selectedTests .selected-test')||!!document.querySelector('#testList li')]
    ];
    cardStates.forEach(([card,hasData])=>card?.classList.toggle('print-empty-card',!hasData));
}

document.addEventListener("keydown",e=>{
    if(e.key!=="Enter")return;

    // Header: Enter moves through every doctor/chamber editable field.
    if(e.target.classList?.contains("editable")){
        if(headerEditableEnter(e.target))e.preventDefault();
        else{
            e.preventDefault();
            document.getElementById("patientName")?.focus();
        }
        return;
    }

    // Patient information: Enter moves left-to-right, then to C/C.
    const patientOrder=[
        "patientName","patientAge","patientGender","patientPhone","patientDate"
    ].map(id=>document.getElementById(id)).filter(Boolean);
    if(patientOrder.includes(e.target)){
        e.preventDefault();
        focusNext(patientOrder,e.target) || document.getElementById("complaintInput")?.focus();
        return;
    }

    // Medicine builder: medicine -> dose 1 -> dose 2 -> dose 3 -> timing -> duration -> note.
    if(["medicineName","dose1","dose2","dose3","medicineTiming","medicineDuration","medicineNote"].includes(e.target.id)){
        handleMedicineEnter(e);
        return;
    }

    // Sidebar: Enter saves the current line and jumps to the next section.
    const map={
        complaintInput:addComplaint,
        mhInput:()=>addHistory("mhInput","mhList"),
        pdhInput:()=>addHistory("pdhInput","pdhList"),
        findingInput:addFinding,
        testInput:addTest
    };
    if(map[e.target.id]){
        e.preventDefault();
        map[e.target.id]();
        const nextMap={
            complaintInput:"mhInput",
            mhInput:"pdhInput",
            pdhInput:"findingInput",
            findingInput:"testInput",
            testInput:"medicineName"
        };
        document.getElementById(nextMap[e.target.id])?.focus();
    }
});

document.addEventListener("input",updatePrintState);
document.addEventListener("change",updatePrintState);
window.addEventListener("beforeprint",updatePrintState);

const dateField=document.getElementById("patientDate");
if(dateField)dateField.valueAsDate=new Date();
updateSelectedTests();
updatePrintState();


/* =========================================================
   MEDICINE DATABASE SEARCH
   Brand / Generic first 1-2 words search
   No medicine image
   ========================================================= */

let medicineDatabase = [];
let medicineLoaded = false;

async function loadMedicineDatabase() {
    try {
        const response = await fetch("./static/medicine%20new.csv");

        if (!response.ok) {
            throw new Error("Medicine CSV could not be loaded");
        }

        const csvText = await response.text();
        medicineDatabase = parseMedicineCSV(csvText);
        medicineLoaded = true;

        console.log(
            "Medicine database loaded:",
            medicineDatabase.length
        );

    } catch (error) {
        console.error("Medicine database error:", error);
    }
}


/* CSV parser */
function parseMedicineCSV(text) {

    const rows = [];
    let row = [];
    let cell = "";
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {

        const char = text[i];
        const next = text[i + 1];

        if (char === '"') {

            if (insideQuotes && next === '"') {
                cell += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }

        } else if (char === "," && !insideQuotes) {

            row.push(cell);
            cell = "";

        } else if (
            (char === "\n" || char === "\r") &&
            !insideQuotes
        ) {

            if (char === "\r" && next === "\n") {
                i++;
            }

            row.push(cell);
            cell = "";

            if (row.some(v => v.trim() !== "")) {
                rows.push(row);
            }

            row = [];

        } else {

            cell += char;
        }
    }

    if (cell !== "" || row.length) {
        row.push(cell);

        if (row.some(v => v.trim() !== "")) {
            rows.push(row);
        }
    }

    if (!rows.length) return [];

    const headers = rows[0].map(h =>
        String(h || "").replace(/^\ufeff/, "").trim().toLowerCase()
    );

    const brandIndex = headers.indexOf("brand");
    const genericIndex = headers.indexOf("generic");
    const strengthIndex = headers.indexOf("strength");
    const typeIndex = headers.indexOf("type");
    const companyIndex = headers.indexOf("company");

    return rows.slice(1).map(r => ({
        brand: (r[brandIndex] || "").trim(),
        generic: (r[genericIndex] || "").trim(),
        strength: (r[strengthIndex] || "").trim(),
        type: (r[typeIndex] || "").trim(),
        company: (r[companyIndex] || "").trim()
    })).filter(m =>
        m.brand || m.generic
    );
}


/* Normalize search text */
function normalizeMedicineText(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}


/*
   Search by Brand OR Generic.

   Example:
   "nabu"
   "nabum"
   "nabumet"
   "nabumetone"

   will find matching medicines.
*/
function medicineMatches(medicine, searchText) {
    const query = normalizeMedicineText(searchText);
    if (!query) return false;

    const brand = normalizeMedicineText(medicine.brand);
    const generic = normalizeMedicineText(medicine.generic);

    // Match only from the beginning of the brand or generic name.
    // This prevents a one-letter query such as "n" from matching a
    // later word such as "niger" inside an otherwise unrelated name.
    return brand.startsWith(query) || generic.startsWith(query);
}


/* Show medicine suggestions */
function showMedicineSuggestions() {

    const input = document.getElementById("medicineName");
    const box = document.getElementById("medicineSuggestions");

    if (!input || !box) return;

    const query = input.value.trim();

    if (!query || query.length < 1 || !medicineLoaded) {
        box.innerHTML = "";
        box.style.display = "none";
        return;
    }

    const matches = medicineDatabase
        .filter(medicine =>
            medicineMatches(medicine, query)
        )
        .slice(0, 30);

    if (!matches.length) {

        box.innerHTML = `
            <div class="medicine-no-result">
                No medicine found
            </div>
        `;

        box.style.display = "block";
        return;
    }


    box.innerHTML = matches.map((medicine, index) => {

        const brand =
            medicine.brand || "Unknown Brand";

        const strength =
            medicine.strength || "";

        const type =
            medicine.type || "";

        const generic =
            medicine.generic || "";

        const company =
            medicine.company || "";

        return `
            <button
                type="button"
                class="medicine-suggestion"
                data-index="${index}"
            >

                <div class="medicine-top-line">

                    <strong>${escapeHtml(brand)}</strong>

                    ${
                        strength
                        ? `<span class="medicine-strength">
                            ${escapeHtml(strength)}
                           </span>`
                        : ""
                    }

                </div>

                ${
                    type
                    ? `<div class="medicine-type">
                        ${escapeHtml(type)}
                       </div>`
                    : ""
                }

                ${
                    generic
                    ? `<div class="medicine-generic">
                        ${escapeHtml(generic)}
                       </div>`
                    : ""
                }

                ${
                    company
                    ? `<div class="medicine-company">
                        ${escapeHtml(company)}
                       </div>`
                    : ""
                }

            </button>
        `;

    }).join("");

    box.style.display = "block";

    // Arrow keys + Enter can be used to choose a suggestion quickly.
    let activeSuggestion = -1;
    const suggestionButtons = [...box.querySelectorAll(".medicine-suggestion")];
    const setActiveSuggestion = index => {
        suggestionButtons.forEach((btn,i)=>btn.classList.toggle("active", i===index));
        activeSuggestion=index;
    };

    /* Click suggestion */
    box.querySelectorAll(".medicine-suggestion")
        .forEach((button, index) => {

            button.addEventListener("click", () => {

                const medicine = matches[index];

                /*
                   Prescription-এর Medicine Name field-এ
                   Brand + Strength + Type বসবে
                */

                let medicineText = medicine.brand;

                if (medicine.strength) {
                    medicineText += " " + medicine.strength;
                }

                if (medicine.type) {
                    medicineText += " " + medicine.type;
                }

                input.value = medicineText.trim();

                box.innerHTML = "";
                box.style.display = "none";

                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
            });

        });

    input.onkeydown = function(e){
        if(!suggestionButtons.length)return;
        if(e.key==="ArrowDown"){
            e.preventDefault();
            setActiveSuggestion(Math.min(activeSuggestion+1,suggestionButtons.length-1));
        }else if(e.key==="ArrowUp"){
            e.preventDefault();
            setActiveSuggestion(Math.max(activeSuggestion-1,0));
        }else if(e.key==="Enter" && activeSuggestion>=0){
            e.preventDefault();
            suggestionButtons[activeSuggestion].click();
        }
    };
}


/* Medicine input */
document.addEventListener("input", function(e) {

    if (e.target.id === "medicineName") {
        showMedicineSuggestions();
    }

});


/* Click outside = close suggestion */
document.addEventListener("click", function(e) {

    const wrap =
        document.querySelector(".medicine-search-wrap");

    const box =
        document.getElementById("medicineSuggestions");

    if (!wrap || !box) return;

    if (!wrap.contains(e.target)) {
        box.style.display = "none";
    }

});


/* Load database */
loadMedicineDatabase();
