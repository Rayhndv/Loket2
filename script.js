/* =========================================
   SMART QUEUE SYSTEM
   ========================================= */

let queue = {
    A: [],
    B: [],
    C: [],
    D: []
};

let current = {
    A: null,
    B: null,
    C: null,
    D: null
};

let lastCalled = null;

let history = [];

let statistics = {
    total: 0,
    served: 0,
    calls: 0
};


/* =========================================
   LOAD DATA
========================================= */

function loadData() {

    const savedQueue = localStorage.getItem("smartQueue");
    const savedCurrent = localStorage.getItem("smartCurrent");
    const savedHistory = localStorage.getItem("smartHistory");
    const savedStats = localStorage.getItem("smartStats");

    if (savedQueue) {
        queue = JSON.parse(savedQueue);
    }

    if (savedCurrent) {
        current = JSON.parse(savedCurrent);
    }

    if (savedHistory) {
        history = JSON.parse(savedHistory);
    }

    if (savedStats) {
        statistics = JSON.parse(savedStats);
    }

    updateAll();
}


/* =========================================
   SAVE DATA
========================================= */

function saveData() {

    localStorage.setItem(
        "smartQueue",
        JSON.stringify(queue)
    );

    localStorage.setItem(
        "smartCurrent",
        JSON.stringify(current)
    );

    localStorage.setItem(
        "smartHistory",
        JSON.stringify(history)
    );

    localStorage.setItem(
        "smartStats",
        JSON.stringify(statistics)
    );
}


/* =========================================
   TAKE TICKET
========================================= */

function takeTicket(type) {

    const number =
        getNextNumber(type);

    queue[type].push(number);

    statistics.total++;

    saveData();

    updateAll();

    showTicket(
        number,
        getServiceName(type)
    );

    playSound(
        `Nomor antrean ${type} ${number}. Silakan menunggu.`
    );
}


/* =========================================
   GET NEXT NUMBER
========================================= */

function getNextNumber(type) {

    let max = 0;

    // Cari nomor terbesar dari antrean
    queue[type].forEach(item => {

        const number =
            parseInt(item.substring(2));

        if (number > max) {
            max = number;
        }

    });


    // Cari dari nomor yang sedang dipanggil
    if (current[type]) {

        const number =
            parseInt(current[type].substring(2));

        if (number > max) {
            max = number;
        }

    }


    return `${type} ${String(max + 1).padStart(3, "0")}`;
}


/* =========================================
   CALL NEXT
========================================= */

function callNext(type) {

    if (queue[type].length === 0) {

        playSound(
            `Tidak ada antrean untuk loket ${type}.`
        );

        return;
    }


    const number =
        queue[type].shift();


    current[type] = number;

    lastCalled = {
        number: number,
        counter: type,
        time: getTime()
    };


    statistics.served++;
    statistics.calls++;


    history.unshift({
        number: number,
        counter: type,
        time: getTime(),
        date: getDate()
    });


    if (history.length > 20) {
        history.pop();
    }


    saveData();

    updateAll();

    animateCall(type);

    playSound(
        `Nomor antrean ${type} ${number.replace(" ", "")}, silakan menuju loket ${type}.`
    );
}


/* =========================================
   REPEAT CALL
========================================= */

function repeatCall(type) {

    if (!current[type]) {

        playSound(
            `Belum ada nomor yang dipanggil di loket ${type}.`
        );

        return;
    }


    const number =
        current[type];


    statistics.calls++;

    saveData();

    updateAll();

    animateCall(type);

    playSound(
        `Pengulangan. Nomor antrean ${number.replace(" ", "")}, silakan menuju loket ${type}.`
    );
}


/* =========================================
   SKIP NUMBER
========================================= */

function skipNumber(type) {

    if (queue[type].length === 0) {

        playSound(
            `Tidak ada nomor yang dapat dilewati.`
        );

        return;
    }


    const skipped =
        queue[type].shift();


    history.unshift({
        number: skipped,
        counter: type,
        time: getTime(),
        date: getDate(),
        status: "Dilewati"
    });


    saveData();

    updateAll();
}


/* =========================================
   UPDATE ALL UI
========================================= */

function updateAll() {

    updateTV();

    updateCounters();

    updateStatistics();

    updateHistory();

    updateNextNumber();
}


/* =========================================
   UPDATE TV
========================================= */

function updateTV() {

    const display =
        document.getElementById("currentNumber");

    const counter =
        document.getElementById("currentCounter");

    const previous =
        document.getElementById("previousNumber");

    const running =
        document.getElementById("runningNumber");


    if (lastCalled) {

        display.textContent =
            lastCalled.number;

        counter.textContent =
            `LOKET ${lastCalled.counter}`;

        running.textContent =
            lastCalled.number;

    } else {

        display.textContent =
            "A 000";

        counter.textContent =
            "LOKET -";

        running.textContent =
            "A 000";
    }


    const totalWaiting =
        Object.values(queue)
        .reduce(
            (sum, list) =>
                sum + list.length,
            0
        );


    document.getElementById(
        "totalQueueTV"
    ).textContent =
        `${totalWaiting} Orang Menunggu`;


    if (history.length > 1) {

        previous.textContent =
            history[1].number;

    } else {

        previous.textContent = "-";

    }
}


/* =========================================
   UPDATE COUNTERS
========================================= */

function updateCounters() {

    ["A", "B", "C", "D"]
        .forEach(type => {

            const number =
                current[type] ||
                `${type} 000`;


            document.getElementById(
                `counter${type}`
            ).textContent =
                number;


            document.getElementById(
                `operator${type}`
            ).textContent =
                number;


            const status =
                document.getElementById(
                    `status${type}`
                );


            if (current[type]) {

                status.textContent =
                    "SEDANG MELAYANI";

                status.style.background =
                    "#fff4dc";

                status.style.color =
                    "#c27b00";

            } else {

                status.textContent =
                    "MENUNGGU";

                status.style.background =
                    "#e9f8f1";

                status.style.color =
                    "#13a76b";
            }

        });
}


/* =========================================
   UPDATE NEXT NUMBER
========================================= */

function updateNextNumber() {

    let next = null;

    const allQueues = [
        ...queue.A,
        ...queue.B,
        ...queue.C,
        ...queue.D
    ];


    if (allQueues.length > 0) {

        next = allQueues[0];

    }


    document.getElementById(
        "nextNumber"
    ).textContent =
        next || "-";
}


/* =========================================
   STATISTICS
========================================= */

function updateStatistics() {

    const waiting =
        Object.values(queue)
        .reduce(
            (sum, list) =>
                sum + list.length,
            0
        );


    document.getElementById(
        "totalQueue"
    ).textContent =
        statistics.total;


    document.getElementById(
        "waitingQueue"
    ).textContent =
        waiting;


    document.getElementById(
        "servedQueue"
    ).textContent =
        statistics.served;


    document.getElementById(
        "callCount"
    ).textContent =
        statistics.calls;
}


/* =========================================
   HISTORY
========================================= */

function updateHistory() {

    const container =
        document.getElementById(
            "historyList"
        );


    if (history.length === 0) {

        container.innerHTML = `
            <div class="empty-history">
                Belum ada riwayat panggilan
            </div>
        `;

        return;
    }


    container.innerHTML =
        history.map(item => `

            <div class="history-item">

                <div>
                    <div class="history-number">
                        ${item.number}
                    </div>

                    <div class="history-counter">
                        Loket ${item.counter}
                    </div>
                </div>

                <div class="history-time">
                    ${item.date}<br>
                    ${item.time}
                </div>

            </div>

        `).join("");
}


/* =========================================
   CLEAR HISTORY
========================================= */

function clearHistory() {

    if (
        !confirm(
            "Hapus seluruh riwayat panggilan?"
        )
    ) {
        return;
    }


    history = [];

    saveData();

    updateAll();
}


/* =========================================
   RESET SYSTEM
========================================= */

function resetSystem() {

    if (
        !confirm(
            "Apakah Anda yakin ingin mereset seluruh sistem?"
        )
    ) {
        return;
    }


    queue = {
        A: [],
        B: [],
        C: [],
        D: []
    };


    current = {
        A: null,
        B: null,
        C: null,
        D: null
    };


    history = [];

    lastCalled = null;


    statistics = {
        total: 0,
        served: 0,
        calls: 0
    };


    saveData();

    updateAll();

    playSound(
        "Sistem antrean telah direset."
    );
}


/* =========================================
   TICKET POPUP
========================================= */

function showTicket(number, service) {

    document.getElementById(
        "ticketNumber"
    ).textContent =
        number;


    document.getElementById(
        "ticketService"
    ).textContent =
        service;


    document.getElementById(
        "ticketPopup"
    ).classList.add("show");
}


function closeTicket() {

    document.getElementById(
        "ticketPopup"
    ).classList.remove("show");
}


/* =========================================
   TEXT TO SPEECH
========================================= */

function playSound(text) {

    if (
        !("speechSynthesis" in window)
    ) {
        return;
    }


    window.speechSynthesis.cancel();


    const speech =
        new SpeechSynthesisUtterance(text);


    speech.lang = "id-ID";

    speech.rate = 0.85;

    speech.pitch = 1;

    speech.volume = 1;


    window.speechSynthesis.speak(
        speech
    );
}


/* =========================================
   ANIMATION
========================================= */

function animateCall(type) {

    const elements = [

        document.getElementById(
            `counter${type}`
        ),

        document.getElementById(
            `operator${type}`
        ),

        document.getElementById(
            "currentNumber"
        )

    ];


    elements.forEach(element => {

        element.classList.remove(
            "call-animation"
        );


        void element.offsetWidth;


        element.classList.add(
            "call-animation"
        );

    });
}


/* =========================================
   DATE
========================================= */

function getDate() {

    const now = new Date();

    return now.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
}


/* =========================================
   TIME
========================================= */

function getTime() {

    return new Date()
        .toLocaleTimeString(
            "id-ID",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );
}


/* =========================================
   SERVICE NAME
========================================= */

function getServiceName(type) {

    const services = {

        A: "LAYANAN UMUM",

        B: "LAYANAN CUSTOMER SERVICE",

        C: "LAYANAN PEMBAYARAN",

        D: "LAYANAN INFORMASI"

    };


    return services[type];
}


/* =========================================
   DIGITAL CLOCK
========================================= */

function updateClock() {

    const now = new Date();


    const time =
        now.toLocaleTimeString(
            "id-ID",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );


    const date =
        now.toLocaleDateString(
            "id-ID",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );


    document.getElementById(
        "clock"
    ).textContent =
        time;


    document.getElementById(
        "date"
    ).textContent =
        date;


    document.getElementById(
        "machineClock"
    ).textContent =
        time.substring(0, 5);
}


/* =========================================
   START
========================================= */

loadData();

updateClock();

setInterval(
    updateClock,
    1000
);