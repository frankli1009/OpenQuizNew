function itemInfo(itemName, itemValue) {
    this.itemName = itemName;
    this.itemValue = itemValue;
}

var quiz = {
    online: true,
    questions: null,
    count: 10,
    category: null,
    type: null,
    difficulty: null,
    index: -1,
    done: 0,
    right: 0,
    countDown: 5,
    answerTime: [], //itemInfo type
    initQuiz: function (data) {
        this.questions = data;
        this.index = -1;
        this.count = data.results.length;
        this.done = 0;
        this.right = 0;
        this.answerTime = [];
    }
};

var curQuestion = {
    iCurSeconds: 5,
    iCorrect: -1,
    startTime: null,
    cntdwnInt: null,
    
    initQuestion: function (iCorrect) {
        
        this.iCorrect = iCorrect;
        this.iCurSeconds = quiz.countDown;
        
        $("#questiontime").text(this.iCurSeconds);
        this.startTime = new Date();
        
        this.cntdwnInt = setInterval(function() {
            //console.log("myInterval, CountDown: "+curQuestion.iCurSeconds);
    
            // Time calculations for days, hours, minutes and seconds
            var secs = --curQuestion.iCurSeconds;
            //console.log("secs: " + secs);

            // If the count down is finished, write some text 
            if (secs === 0) {
                clearInterval(curQuestion.cntdwnInt);
                $("#questiontime").text("");
                nextQuestion();
            } else {
                // Display the result in the element with id="questiontime"
                $("#questiontime").text(secs);
            }
        }, 1000);        
    }
};

$(function(){
    $.getJSON("https://opentdb.com/api_category.php")
    .done(function(data) {
        //console.log(data.trivia_categories);
        loadCategoriesAndSettings(data);
        quiz.online = true;
    })
    .fail(function() {
        console.error("fail to get categories");
        quiz.online = false;
        loadLocalQuizInfo();
        //connectionFailure();
    });
    
    $('#myModal').on('shown.bs.modal', function(){ 
       addModalBody();
    });
    
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
        
    $(".answerBorder").on("click", function(e) {
        //console.log(e.target.id);
        var choice = e.target.id.substring(6,7);
        //console.log(choice);
        if(parseInt(choice) === curQuestion.iCorrect) quiz.right++;
        clearInterval(curQuestion.cntdwnInt);
        curQuestion.cntdwnInt = null;
        nextQuestion();
    });
        
    $("#startquiz").on("click", function() {
        if(!saveQuizSettings()) return;

        $("#startgamediv").hide();
        $(".questionResultDiv").show();
        
        $("#didit").html("0 / 0");
        
        var url = "";
        if(quiz.online) {
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
            .done(function(data) {
                //console.log(data);
                if(data.response_code === 0) {
                    quiz.initQuiz(data);
                    showNextQuestion();
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
    
    $("#changechart").on("click", function(e) {
        e.preventDefault();
        toggleChart();
    });
    
    $("#newgame").on("click", function() {
        if(curQuestion.cntdwnInt != null) {
            clearInterval(curQuestion.cntdwnInt);
            curQuestion.cntdwnInt = null;
        }
        
        $("#startquiz").click();
    });
});

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

function loadQuizSettings() {
    try{
        iQuizCount = parseInt(localStorage.getItem("quizCount"));
        if(isNaN(iQuizCount)) {
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
        console.warn("Can't find the original quiz settings.")
    }
}

function saveQuizSettings() {
    if(!validCount($("#quizcount").val(), 5, 50)) {
       alert("Please enter a number between 5 and 50 for number of questions.");
       return false;
    }
    if(!validCount($("#quiztime").val(), 3, 60)) {
       alert("Please enter a number between 3 and 60 for limited time per question.");
       return false;
    }

    quiz.count = parseInt($("#quizcount").val());
    quiz.category = $("#quizcategory").val();
    quiz.type = $("#quiztype").val();
    quiz.difficulty = $("#quizdifficulty").val();
    quiz.countDown = parseInt($("#quiztime").val());
    //console.log("countdown: "+quiz.countDown);
    
    localStorage.setItem("quizCount", quiz.count);
    localStorage.setItem("quizCategory", quiz.category);
    localStorage.setItem("quizType", quiz.type);
    localStorage.setItem("quizDifficulty", quiz.difficulty);
    localStorage.setItem("quizCountDown", quiz.countDown);
    
    return true;
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

function validCount(val, min, max) {
    if(val === null || val < min || val > max ) {
        return false;
    }
    
    return true;
}

function showNextQuestion() {
    if( quiz.count <= 0 ) return;
    
    quiz.index++;
    if(quiz.index < quiz.count) {
        //clearRadioState();
        var question = quiz.questions.results[quiz.index]; 
        /*
        $("#questionCategory").text(question.category);
        $("#questionType").text(question.type);
        $("#questionDifficulty").text(question.difficulty);
        */
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

function loadCategoriesAndSettings(data) {
    data.trivia_categories.forEach(function(category, index) {
        //console.log(category.name);
        $option = $("<option>");
        $option.text(category.name);
        $option.attr("value", category.id);
        $("#quizcategory").append($option);
    });
    //$("#quizresult").text("Ready, give it a go...");
    loadQuizSettings();
}

function loadLocalQuizInfo() {
    $.getJSON("data\categories.json")
    .done(function(data) {
        loadCategoriesAndSettings(data);
    })
    .fail(function() {
        console.error("file 'data\categories.json' doesn't exist.");
    });
}

function getQuestionCategory() {
    if(quiz.category) 
        return quiz.category;
    else {
        var max = $("#quizcategory").options.length;
        var index = Math.floor(Math.random()) * (max - 1) + 1;
        return $("#quizcategory").options[index].value;
    }
}

function getLocalQuestions() {
    var i=0;
    do{
        var category = getQuestionCategory();
        var type = getQuestionType();
        var difficulty = getQuestionDifficulty();
    } while(++i < quiz.count);
}