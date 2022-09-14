/* constants */
const defaultTimer = {
    startTime: '09:30',
    intervalTime: '01:30',
    endTime: '19:00',
    workHours: '08:00',
};

let timerObj = undefined;

/* utils */
const storage = {
    get: (key, callback) => {
        chrome.storage.sync.get(key, callback);
    },
    set: (key) => {
        chrome.storage.sync.set(key);
    }
}

// 格式化时间
const formatDuring = (mss) => {
    let hours = parseInt((mss % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = parseInt((mss % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = parseInt((mss % (1000 * 60)) / 1000);
    return `${('00' + hours).slice(-2)}:${('00' + minutes).slice(-2)}:${('00' + seconds).slice(-2)}`
}

/* data */

/* methods */
// 重置时间记录
const resetTimer = () => {
    timerObj = JSON.parse(JSON.stringify(defaultTimer));
    storage.set({
        musictimer: JSON.stringify(timerObj),
    });
    showTimer();
}

// 计算工作时长
const calculateEndTime = (key) => {
    let [hour1, minute1] = timerObj.startTime.split(':');
    let start = new Date().setHours(Number(hour1), Number(minute1), 0, 0);
    let [hour2, minute2] = timerObj.intervalTime.split(':');
    let [hour3, minute3] = timerObj.workHours.split(':');
    let [hour4, minute4] = timerObj.endTime.split(':');
    let end = new Date().setHours(Number(hour4), Number(minute4), 0, 0);
    if (key === 'endTime') {
        // 不固定工作时长，计算下班时间，或计算工作时长
        let differenceTime = end - start - 60*60*1000*hour2 - 60*1000*minute2;
        if (differenceTime <= 0) {
            timerObj.workHours = '00:00';
        } else {
            let workDate = new Date(differenceTime - 8*60*60*1000);
            let hours = ('00' + workDate.getHours()).slice(-2);
            let minutes = ('00' + workDate.getMinutes()).slice(-2);
            timerObj.workHours = hours + ":" + minutes;
        }
    } else {
        // 通用计算下班时间
        let endTimeNew = new Date(start + 60*60*1000*(1*hour2+1*hour3) + 60*1000*(1*minute2+1*minute3));
        if (new Date(start).getDate() !== endTimeNew.getDate()) {
            timerObj.endTime = '23:59';
        } else {
            let hours = ('00' + endTimeNew.getHours()).slice(-2);
            let minutes = ('00' + endTimeNew.getMinutes()).slice(-2);
            timerObj.endTime = hours + ":" + minutes;
        }
    }
}

// keyup 函数工厂
const keyupFunctionFactory = (key, index) => {
    return function() {
        let value = this.value.replace(/[^\d]$/g,'');
        udpateTimer(key, index, value);
    }
}

// blur 函数工厂
const blurFunctionFactory = (key, index) => {
    const limit = index === 0 ? 23 : 59;
    return function() {
        let value = this.value;
        if (value > limit) {
            value = limit;
        }
        if (value.length < 2) {
            value = ('00' + value).slice(-2);
        }
        udpateTimer(key, index, value);
    }
}

// 上钟时间：
let hourInput1 = document.querySelector('.hour1');
hourInput1.addEventListener('keyup', keyupFunctionFactory('startTime', 0))
hourInput1.addEventListener('blur', blurFunctionFactory('startTime', 0))

let minuteInput1 = document.querySelector('.minute1');
minuteInput1.addEventListener('keyup', keyupFunctionFactory('startTime', 1))
minuteInput1.addEventListener('blur', blurFunctionFactory('startTime', 1))

// 休息时长：
let hourInput2 = document.querySelector('.hour2');
hourInput2.addEventListener('keyup', keyupFunctionFactory('intervalTime', 0))
hourInput2.addEventListener('blur', blurFunctionFactory('intervalTime', 0))

let minuteInput2 = document.querySelector('.minute2');
minuteInput2.addEventListener('keyup', keyupFunctionFactory('intervalTime', 1))
minuteInput2.addEventListener('blur', blurFunctionFactory('intervalTime', 1))

// 在钟时长：
let hourInput3 = document.querySelector('.hour3');
hourInput3.addEventListener('keyup', keyupFunctionFactory('workHours', 0))
hourInput3.addEventListener('blur', blurFunctionFactory('workHours', 0))

let minuteInput3 = document.querySelector('.minute3');
minuteInput3.addEventListener('keyup', keyupFunctionFactory('workHours', 1))
minuteInput3.addEventListener('blur', blurFunctionFactory('workHours', 1))

// 预计下钟时间：
let hourInput4 = document.querySelector('.hour4');
hourInput4.addEventListener('keyup', keyupFunctionFactory('endTime', 0))
hourInput4.addEventListener('blur', blurFunctionFactory('endTime', 0))

let minuteInput4 = document.querySelector('.minute4');
minuteInput4.addEventListener('keyup', keyupFunctionFactory('endTime', 1))
minuteInput4.addEventListener('blur', blurFunctionFactory('endTime', 1))

// 重置
let reset = document.querySelector('.reset');
reset.addEventListener('click', function() {
    resetTimer();
})

/* render */
// 展示数据
const showTimer = (key) => {
    // 计算下班时间
    calculateEndTime(key);
    // 展示数据
    hourInput1.value = timerObj.startTime.split(':')[0];
    minuteInput1.value = timerObj.startTime.split(':')[1];
    hourInput2.value = timerObj.intervalTime.split(':')[0];
    minuteInput2.value = timerObj.intervalTime.split(':')[1];
    hourInput3.value = timerObj.workHours.split(':')[0];
    minuteInput3.value = timerObj.workHours.split(':')[1];
    hourInput4.value = timerObj.endTime.split(':')[0];
    minuteInput4.value = timerObj.endTime.split(':')[1];
    // 展示工作百分比
    showPercentage();
};

// 渲染百分比
let progressNumber = null;
let progress = null;
let progressContent = null;
const showPercentage = () => {
    progressNumber = progressNumber || document.querySelector('.progressNumber');
    progress = progress || document.querySelector('.progress');
    progressContent = progressContent || document.querySelector('.progressContent');
    // 计算当前已工作时长
    let [hour1, minute1] = timerObj.startTime.split(':');
    let start = new Date().setHours(Number(hour1), Number(minute1), 0, 0);
    let [hour2, minute2] = timerObj.intervalTime.split(':');
    let intervalTimeStart = new Date().setHours(12, 0, 0, 0);
    let intervalTimeEnd = new Date().setHours(12+Number(hour2), Number(minute2), 0, 0);
    let now = new Date().getTime();
    let workDate = 0;
    if (start < intervalTimeStart) {
        if (now < intervalTimeStart) {
            workDate = now - start;
        } else if (now < intervalTimeEnd) {
            workDate = intervalTimeStart - start;
        } else if (now > intervalTimeEnd) {
            workDate = now - start - 60*60*1000*hour2 - 60*1000*minute2;
        }
    } else if (start < intervalTimeEnd) {
        workDate = now - intervalTimeEnd;
    } else if (start > intervalTimeEnd) {
        workDate = now - start;
    }
    workDate = workDate < 0 ? 0 : workDate;
    // 计算总工作时长
    let [hour3, minute3] = timerObj.workHours.split(':');
    const workTimes = 60*60*1000*hour3 + 60*1000*minute3;
    // 计算百分比
    let percentage = 0;
    if (workTimes) {
        percentage = Math.floor(workDate / workTimes * 10000) / 100;
    }
    progressNumber.innerText = `${percentage}%`;
    progress.style.width = `${percentage > 100 ? 100 : percentage}%`;
    progressContent.innerText = `${formatDuring(workDate)}/${formatDuring(workTimes)}`
}

// 更新数据并存储
const udpateTimer = (key, index, value) => {
    let v = timerObj[key]
    if (index === 0) {
        timerObj[key] = value + ':' + v.split(":")[1];
    } else if (index === 1) {
        timerObj[key] = v.split(":")[0] + ':' + value;
    }
    storage.set({
        musictimer: JSON.stringify(timerObj)
    });
    showTimer(key);
}

/** useEffect */
// 初始化
const init = () => {
    storage.get('musictimer', ({musictimer}) => {
        try {
            timerObj = musictimer ? JSON.parse(musictimer) : JSON.parse(JSON.stringify(defaultTimer));
            showTimer();
        } catch (error) {
            console.log('musictimer JSON.parse error: ', error)
        }
    });
    setInterval(() => {
        showPercentage();
    }, 1000);
}

init();
