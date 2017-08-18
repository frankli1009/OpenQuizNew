//itemInfo is an object type for chart data
function itemInfo(itemName, itemValue) {
    this.itemName = itemName;
    this.itemValue = itemValue;
}

//core data of one quiz
var quiz = {
    online: true, //if opentdb.com/api works, use the online api
    questions: null, //hold the questions data
    count: 10, //the question numbers for one quiz
    category: null, //the category for one quiz
    type: null, //the type for one quiz, e.g.: all/multiple/boolean
    difficulty: null, //the difficulty of one quiz, e.g.: all/easy/medium/hard
    index: -1, //the index of current question
    done: 0, //the numbers of questions that the user has done
    right: 0, //the numbers of questions that the user has got the right answer
    countDown: 5, //the time limitation for one question
    answerTime: [], //itemInfo type, for chart data of time used
    
    //initialize a new quiz
    initQuiz: function (data) {
        this.questions = data;
        this.index = -1;
        this.count = data.results.length;
        this.done = 0;
        this.right = 0;
        this.answerTime = [];
    }
};

//control data of current question
var curQuestion = {
    iCurSeconds: 5, //the lef time to make a decision
    iCorrect: -1, //the index of the right answer
    startTime: null, //the time that the user starts a new question, for calculating the time used on this question
    cntdwnInt: null, //the interval for count down
    
    //initialize the control data of current question
    initQuestion: function (iCorrect) {
        
        this.iCorrect = iCorrect;
        this.iCurSeconds = quiz.countDown;
        
        // Display the left time in the element with id="questiontime"
        $("#questiontime").text(this.iCurSeconds);
        //save the start time
        this.startTime = new Date();
        
        //start a new count down
        this.cntdwnInt = setInterval(function() {
            //console.log("myInterval, CountDown: "+curQuestion.iCurSeconds);
    
            // Time count down in seconds
            var secs = --curQuestion.iCurSeconds;
            //console.log("secs: " + secs);

            // If the count down is finished, reset the count down relative stuff and start the next question 
            if (secs === 0) {
                clearInterval(curQuestion.cntdwnInt);
                $("#questiontime").text("");
                nextQuestion();
            } else {
                // Display the left time in the element with id="questiontime"
                $("#questiontime").text(secs);
            }
        }, 1000);        
    }
};

var $window;
$(function(){
    //try to get the quiz categories from opentdb.com/api
    $.getJSON("https://opentdb.com/api_category.php")
    .done(function(data) {
        //console.log(data.trivia_categories);
        loadCategoriesAndSettings(data);
        quiz.online = true;
    })
    .fail(function() {
        console.error("fail to get categories");
        quiz.online = false;
        //loadLocalQuizInfo();
        connectionFailure();
    });
    
    //add the modal body div when showing settings on small devices
    $('#myModal').on('shown.bs.modal', function(){ 
       addModalBody();
    });
    
    //onclick event action for save settings btn, validate and save the settings on small devices
    $("#savesettings").on("click", function() {
        if(saveQuizSettings()) return;
        else return false;
    });
    
    //avoid key "enter", "." and "E" being input into number of questions
    $("#quizcount").on("keydown", function (e) {
        return skipKeys(e);
    });
    
    //avoid key "enter", "." and "E" being input into time limitation per question
    $("#quiztime").on("keydown", function(e) {
        return skipKeys(e);
    });
        
    //onclick event action for answers div, check whether the answer is right, then shift to the next question
    $(".answerBorder").on("click", function(e) {
        //console.log(e.target.id); //answer1, answer2, answer3, answer4
        var choice = e.target.id.substring(6,7);
        //console.log(choice);
        if(parseInt(choice) === curQuestion.iCorrect) quiz.right++;
        clearInterval(curQuestion.cntdwnInt);
        curQuestion.cntdwnInt = null;
        nextQuestion();
    });
        
    //onlick event action for start a new quiz
    $("#startquiz").on("click", function() {
        if(!saveQuizSettings()) return;

        $("#startgamediv").hide();
        $(".questionResultDiv").show();
        
        $("#didit").html("0 / 0");
        
        var url = "";
        if(quiz.online) { //opentdb.com/api works
            //get the questions in json format by ajax
            url += "https://opentdb.com/api.php?amount="+quiz.count; 
            if(quiz.category) {
                url += "&category=" + quiz.category;
            }
            if(quiz.type) {
                url += "&type=" + quiz.type;
            }
            if(quiz.difficulty) {
                url += "&difficulty=" + quiz.difficulty;
            }
            //console.log(url);
            $.getJSON(url)
            .done(function(data) { //ajax done
                //console.log(data);
                if(data.response_code === 0) { //data state ok
                    //initialize quiz information and start a question
                    quiz.initQuiz(data);
                    showNextQuestion();
                    //hide result div
                    showResult(false);
                } else {
                    console.error("response_code: "+data.response_code);
                    connectionFailure();
                }
            })
            .fail(function() {
                console.error("fail to get questions");
                connectionFailure();
                $("#didit").html("");
            });
        } else {
            getLocalQuestions();
        }
         
    });
    
    //onclick event action for changechart button, toggle between right/wrong chart and time used chart
    $("#changechart").on("click", function(e) {
        e.preventDefault();
        toggleChart();
    });
    
    //onclick event action for newgame button, start a new game
    $("#newgame").on("click", function() {
        //if there is a question, clear the count down interval of the question 
        if(curQuestion.cntdwnInt != null) {
            clearInterval(curQuestion.cntdwnInt);
            curQuestion.cntdwnInt = null;
        }
        
        $("#startquiz").click();
    });
    
    //recenter the body when window resize
    var $window = $(window);
    $window.on("resize", function() {
        
        var height = $window.innerHeight();
        var bodyheight = $("#headsec").height() + $("#mainsec").height();
        //console.log("winheight: "+height+", bodyheight: "+bodyheight);
        //console.log("headsec-marginTop: "+$("#headsec").css("marginTop")+", settingBtn-top: "+$(".settingBtn").css("top"));
        if(height > bodyheight) {
            $("#headsec").css("marginTop", (height - bodyheight) / 2);
            $(".settingBtn").css("top", (height - bodyheight) / 2 + 30);
        }
        
        //reset result div width when using on small screen
        //var width = $window.innerWidth(); 
        //resetResultDivWidth(width);
    });
    
    $.ready($window.trigger("resize"));
    
});

//reset result div width when using on small screen
function resetResultDivWidth(width) {
       
    console.log("winwidth: "+width);
    if(width < 500) {
        $(".resultDiv").width(width);
        $(".resultChartRow").width(width);
        $(".resultChart").width(width);
        $(".canvasjs-chart-container").width(width);
        $(".canvasjs-chart-canvas").width(width);
    }
    else {
        $(".resultDiv").width("100%");
        $(".resultChartRow").width("100%");
    }    
}

//avoid key "enter", "." and "E" being input into the text input element
function skipKeys(e) {
    //console.log(e.keyCode);
    switch(e.keyCode) {
        case 13: // enter key, skipped
        case 46: // period (46, 190), skipped
        case 190: // period (46, 190), skipped
        case 69: // "E" (69) key, skipped
            e.preventDefault();
            return false;
    }
    return true;
}


function connectionFailure() {
    $("#quizresult").text("Load Failure!");
    $("#chartrightwrong").text("Due to connection error, we can't load quiz now, please try it later.");
    showResult(true, false);
}

function addModalBody() {
    $modalBody = $(".modal-body");
    if(!($modalBody.hasClass("ownchild"))) {
        $settings = $("#settings");
        $modalBody.append($settings);
        $modalBody.addClass("ownchild");
        $settings.show();
    }
}

//toggle between right/wrong chart and time used chart
function toggleChart() {
    var $changeChart = $("#changechart");
    if($changeChart.text().indexOf("Time")>-1) {
        $changeChart.html("Right/Wrong");
        $("#chartrightwrong").addClass("hideChart");
        $("#charttimeused").removeClass("hideChart");
    } else {
        $changeChart.html("Time Used");
        $("#charttimeused").addClass("hideChart");
        $("#chartrightwrong").removeClass("hideChart");
    }
}

//toggle between questions div and result div
//when result div is on, hide toggle-chart button as required(e.g.: show api service failure result)
function showResult(showRes, showBtn) {
    if(showRes) {
        $("#questiondiv").hide();
        if(showBtn) {
            $(".floatBtn").show();
        } else {
            $(".floatBtn").hide();
        }
        $("#resultdiv").show();
    } else {
        $("#resultdiv").hide();
        $("#questiondiv").show();
    }
}

//Validate a int value and its range
function validCount(val, min, max) {
    if(val === null || val < min || val > max ) {
        return false;
    }
    
    return true;
}

//show the next question by quiz.index++
function showNextQuestion() {
    if( quiz.count <= 0 ) return;
    
    quiz.index++;
    if(quiz.index < quiz.count) {
        var question = quiz.questions.results[quiz.index]; 
        $("#questionIt").html(question.question);
        var iCount = getAnswerCount(question.type);
        var iCorrect = getCorrectIndex(iCount);
        //console.log("correct: "+iCorrect);
        for(var i=0; i<iCount; i++) {
            if(i === iCorrect) {
                $("#ques1"+i).html(question.correct_answer);
                if(question.correct_answer.length>40) {
                    
                }
            } else {
                if(i<iCorrect) {
                    $("#ques1"+i).html(question.incorrect_answers[i]);
                } else {
                    $("#ques1"+i).html(question.incorrect_answers[i-1]);
                }
            }
            
        }
        
        if(question.type === "multiple") {
            removeClass($("#answer1"), "twoAvailAnswers");
            addClass($("#answer1"), "fourAvailAnswers");
            removeClass($("#answer2"), "twoAvailAnswers");
            addClass($("#answer2"), "fourAvailAnswers");
            addClass($("#answer1"), "borderBottomYellow");
            addClass($("#answer2"), "borderBottomYellow");
            
            $("#quesrow2").show();
        } else {
            removeClass($("#answer1"), "fourAvailAnswers");
            addClass($("#answer1"), "twoAvailAnswers");
            removeClass($("#answer2"), "fourAvailAnswers");
            addClass($("#answer2"), "twoAvailAnswers");
            removeClass($("#answer1"), "borderBottomYellow");
            removeClass($("#answer2"), "borderBottomYellow");
            
            
            $("#quesrow2").hide();
        }
        
        curQuestion.initQuestion(iCorrect);
        
    } else {
        var quizRes = quiz.right * 100 / quiz.count;
        //quizRes = 90;
        $("#quizresult").text(quizRes >= 85 ? "Excellent Job!" :
                             quizRes >= 60 ? "Well Done!" : "More Practice!");
        var rightWrong = [];
        rightWrong.push(new itemInfo('right', quiz.right));
        rightWrong.push(new itemInfo('wrong', quiz.count-quiz.right));
        addChart('chartrightwrong', 'doughnut', 'Right/Wrong', rightWrong);
        
        addChart('charttimeused', 'line', 'Time Used', quiz.answerTime);
        showResult(true, true);
        $(".resultChart").show();
        $(".resultChart").resize();
    }
}

function removeClass($el, cls) {
    if($el.hasClass(cls)) 
        $el.removeClass(cls);
}

function addClass($el, cls) {
    if(!($el.hasClass(cls)))
        $el.addClass(cls);
}

function addChart(idContainer, chartType, chartTitle, dataToDisplay) {
    $document = $(document);
    var chartWidth, chartHeight;
    var dwidth = $document.innerWidth();
    var dheight = $document.innerHeight();
    if(dwidth >= 768) {
        chartWidth = 500;
        chartHeight = 360;
    } else {
        chartWidth = dwidth < 530 ? dwidth - 30 : 500;
        chartHeight = dheight < 500 ? dheight - 140 : 360;
    }
    $(".resultChart").width(chartWidth+3);
    
    //console.log("dwidth: "+dwidth+", dheight: "+dheight);
    //console.log("chartWidth: "+chartWidth+", chartHeight: "+chartHeight);
    
    var chart = new CanvasJS.Chart(idContainer, {
        theme: "theme2",//theme1
        backgroundColor: "transparent", //custom css, looking on the web docs for it
        height: chartHeight,
        width: chartWidth,
        title:{
            text: chartTitle,
            fontColor: "rgb(225,225,225)"
        },
        animationEnabled: false,   // change to true
        axisX: {
            labelFontColor: "rgb(225,225,225)"
        },
        axisY: {
            labelFontColor: "rgb(225,225,225)"
        },
        legend:{
            verticalAlign: "bottom",
            horizontalAlign: "center"
        },
        data: [              
        {
            // Change type to "bar", "area", "spline", "pie",etc.
            type: chartType,
            indexLabelFontColor: "rgb(225,225,225)",
            indexLabelLineColor: "rgb(225,225,225)",
            showLegend: true,
            dataPoints: [
            ]

        }
        ]
    });
    dataToDisplay.forEach(function(item, index) {
        chart.options.data[0].dataPoints.push({ "label":  item.itemName,  "y": item.itemValue});
    });
    chart.render();
    
}

function getAnswerCount(type) {
    return type === "multiple" ? 4 : 2;
}

function getCorrectIndex(answerCount) {
    return Math.floor(Math.random() * answerCount);
}

//function clearRadioState() {
//    $("input[type='radio']").each(function() {
//        console.log(this.id);
//        console.log(this.checked);
//        if(this.checked) this.checked = false;
//        //removeAttr("checked");
//    });
//}
    
function nextQuestion() {
    if(curQuestion.startTime != null) {
        var curTime = new Date();
        quiz.answerTime.push(new itemInfo(quiz.done+1, (curTime - curQuestion.startTime) / 1000.0));
    }
    
    quiz.done++;
    $("#didit").html(quiz.right + " / " + quiz.done);
    showNextQuestion();
}

/*load the quiz settings from localStorage if there is one,
  otherwise use the default one*/
function loadQuizSettings() {
    try{
        iQuizCount = parseInt(localStorage.getItem("quizCount"));
        if(isNaN(iQuizCount)) {
            console.warn("No quiz settings is saved.")
            return;
        }
        quiz.count = iQuizCount;
        $("#quizcount").val(quiz.count);
        quiz.category = localStorage.getItem("quizCategory");
        $("#quizcategory").val(quiz.category);
        quiz.type = localStorage.getItem("quizType");
        $("#quiztype").val(quiz.type);
        quiz.difficulty = localStorage.getItem("quizDifficulty");
        $("#quizdifficulty").val(quiz.difficulty);
        quiz.countDown = parseInt(localStorage.getItem("quizCountDown"));
        $("#quiztime").val(quiz.countDown);
    }
    catch(e) {
        console.warn("Can't find the quiz settings.")
    }
}

/*save settings to the localStorage and initialize the quiz data with new settings
  return true(successful) or false(failure)*/
function saveQuizSettings() {
    //validate the settings
    if(!validCount($("#quizcount").val(), 5, 50)) {
       alert("Please enter a number between 5 and 50 for number of questions.");
       return false;
    }
    if(!validCount($("#quiztime").val(), 3, 60)) {
       alert("Please enter a number between 3 and 60 for limited time per question.");
       return false;
    }

    //initialize the quiz data with new settings
    quiz.count = parseInt($("#quizcount").val());
    quiz.category = $("#quizcategory").val();
    quiz.type = $("#quiztype").val();
    quiz.difficulty = $("#quizdifficulty").val();
    quiz.countDown = parseInt($("#quiztime").val());
    //console.log("countdown: "+quiz.countDown);
    
    //save settings to the localStorage
    localStorage.setItem("quizCount", quiz.count);
    localStorage.setItem("quizCategory", quiz.category);
    localStorage.setItem("quizType", quiz.type);
    localStorage.setItem("quizDifficulty", quiz.difficulty);
    localStorage.setItem("quizCountDown", quiz.countDown);
    
    return true;
}

//initialize the settings
function loadCategoriesAndSettings(data) {
    data.trivia_categories.forEach(function(category, index) {
        //console.log(category.name);
        $option = $("<option>");
        $option.text(category.name);
        $option.attr("value", category.id);
        $("#quizcategory").append($option);
    });
    //load quiz settings from localStorage if there is one
    loadQuizSettings();
}

//load the quiz category from my own website data when api service breaks down
function loadLocalQuizInfo() {
    $.getJSON("data\categories.json")
    .done(function(data) {
        loadCategoriesAndSettings(data);
    })
    .fail(function() {
        console.error("file 'data\categories.json' doesn't exist.");
    });
}

//get a random category for a new question when api service breaks down
function getQuestionCategory() {
    if(quiz.category) 
        return quiz.category;
    else {
        var max = $("#quizcategory").options.length;
        var index = Math.floor(Math.random()) * (max - 1) + 1;
        return $("#quizcategory").options[index].value;
    }
}

//get new quiz questions when api service breaks down
function getLocalQuestions() {
    var i=0;
    do{
        var category = getQuestionCategory();
        var type = getQuestionType();
        var difficulty = getQuestionDifficulty();
    } while(++i < quiz.count);
}