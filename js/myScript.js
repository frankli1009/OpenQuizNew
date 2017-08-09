function itemInfo(itemName, itemValue) {
    this.itemName = itemName;
    this.itemValue = itemValue;
}

var quiz = {
    questions: null,
    count: 0,
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
        this.answerTime.removeAll();
    }
};

var curQuestion = {
    iCurSeconds: 5,
    iCorrect: -1,
    cntdwnInt: null,
    
    initQuestion: function (iCorrect) {
        
        this.iCorrect = iCorrect;
        this.iCurSeconds = quiz.countDown;
        
        $("#questiontime").text(this.iCurSeconds);
        
        this.cntdwnInt = setInterval(function() {
            console.log("myInterval, CountDown: "+curQuestion.iCurSeconds);
    
            // Time calculations for days, hours, minutes and seconds
            var secs = --curQuestion.iCurSeconds;
            console.log("secs: " + secs);

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

function myInterval() {

    console.log("myInterval, CountDown: "+curQuestion.iCurSeconds);
    
    // Time calculations for days, hours, minutes and seconds
    var secs = --curQuestion.iCurSeconds;
    console.log("secs: " + secs);

    // If the count down is finished, write some text 
    if (secs < 0) {
        clearInterval(curQuestion.cntdwnInt);
        $("#questiontime").text("");
        nextQuestion();
    } else {
        // Display the result in the element with id="questiontime"
        $("#questiontime").text(secs + " s");
    }
}

$(function(){
    $.getJSON("https://opentdb.com/api_category.php")
    .done(function(data) {
        console.log(data.trivia_categories);
        data.trivia_categories.forEach(function(category, index) {
            console.log(category.name);
            $option = $("<option>");
            $option.text(category.name);
            $option.attr("value", category.id);
            $("#quizcategory").append($option);
        });
        $("#quizresult").text("Ready, give it a go...");
    })
    .fail(function() {
        console.log("fail to get categories");
        $("#quizresult").text("Can't load quiz categories, please try it later.");
        
    })
    .always(function() {
        showResult(true);
    });
    
    $("#quizcount").on("keydown", function (e) {
        //console.log(e.keyCode);
        switch(e.keyCode) {
            case 13: // enter key, skipped
                e.preventDefault();
                return false;
            case 46: // period (46, 190) and "E" (69) key, need to be skipped
                e.preventDefault();
                return false;
            case 190: // period (46, 190) and "E" (69) key, need to be skipped
                e.preventDefault();
                return false;
            case 69: // period (46, 190) and "E" (69) key, need to be skipped
                e.preventDefault();
                return false;
        }
    });
        
    $(".answerDiv").on("click", function(e) {
        //console.log(e.target.id);
        var choice = e.target.id.substring(5,6);
        //console.log(choice);
        if(parseInt(choice) === curQuestion.iCorrect) quiz.right++;
        clearInterval(curQuestion.cntdwnInt);
        curQuestion.cntdwnInt = null;
        nextQuestion();
    });
        
    $("#startquiz").on("click", function() {
        if(!validCount($("#quizcount").val(), 5, 50)) {
           alert("Please enter a number between 5 and 50 for number of questions.");
           return;
        }
        if(!validCount($("#quiztime").val(), 3, 60)) {
           alert("Please enter a number between 3 and 60 for limited time per question.");
           return;
        }
        
        $(".newGameDiv").hide();
        $(".questionResultDiv").show();
        
        var quizCount = parseInt($("#quizcount").val());
        quiz.count = quizCount;
        var quizCategory = $("#quizcategory").val();
        var quizType = $("#quiztype").val();
        var quizDifficulty = $("#quizdifficulty").val();
        quiz.countDown = parseInt($("#quiztime").val());
        console.log("countdown: "+quiz.countDown);
        
        $("#didit").html("0 / 0");
        
        var url = "https://opentdb.com/api.php?amount="+quiz.count;
        if(quizCategory) {
            url += "&category=" + quizCategory;
        }
        if(quizType) {
            url += "&type=" + quizType;
        }
        if(quizDifficulty) {
            url += "&difficulty=" + quizDifficulty;
        }
        console.log(url);
        
        $.getJSON(url)
        .done(function(data) {
            console.log(data);
            if(data.response_code === 0) {
                quiz.initQuiz(data);
                showNextQuestion();
                showResult(false);
            } else {
                console.log("response_code: "+data.response_code);
                $("#quizresult").text("Can't load quiz question, please try it later.");
                showResult(true);
            }
            
            
        })
        .fail(function() {
            console.log("fail to get questions");
            $("#quizresult").text("Can't load quiz question, please try it later.");
            showResult(true);
            $("#didit").html("");
        });
    });

});

function showResult(showRes) {
    if(showRes) {
        $(".questionDiv").hide();
        $(".resultDiv").show();
    } else {
        $(".resultDiv").hide();
        $(".questionDiv").show();
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
        clearRadioState();
        var question = quiz.questions.results[quiz.index]; 
        /*
        $("#questionCategory").text(question.category);
        $("#questionType").text(question.type);
        $("#questionDifficulty").text(question.difficulty);
        */
        $("#questionIt").html(question.question);
        var iCount = getAnswerCount(question.type);
        var iCorrect = getCorrectIndex(iCount);
        console.log("correct: "+iCorrect);
        for(var i=0; i<iCount; i++) {
            if(i === iCorrect) {
                $("#ques1"+i).text(question.correct_answer);
                if(question.correct_answer.length>40) {
                    
                }
            } else {
                if(i<iCorrect) {
                    $("#ques1"+i).text(question.incorrect_answers[i]);
                } else {
                    $("#ques1"+i).text(question.incorrect_answers[i-1]);
                }
            }
            
        }
        
        if(question.type === "multiple") {
            if($("#answer1").hasClass("twoAvailAnswers"))
                $("#answer1").removeClass("twoAvailAnswers");
            if(!$("#answer1").hasClass("fourAvailAnswers"))
                $("#answer1").addClass("fourAvailAnswers");
            if($("#answer2").hasClass("twoAvailAnswers"))
                $("#answer2").removeClass("twoAvailAnswers");
            if(!$("#answer2").hasClass("fourAvailAnswers"))
                $("#answer2").addClass("fourAvailAnswers");
            $("#quesrow2").show();
        } else {
            if($("#answer1").hasClass("fourAvailAnswers"))
                $("#answer1").removeClass("fourAvailAnswers");
            if(!$("#answer1").hasClass("twoAvailAnswers"))
                $("#answer1").addClass("twoAvailAnswers");
            if($("#answer2").hasClass("fourAvailAnswers"))
                $("#answer2").removeClass("fourAvailAnswers");
            if(!$("#answer2").hasClass("twoAvailAnswers"))
                $("#answer2").addClass("twoAvailAnswers");
            $("#quesrow2").hide();
        }
        
        curQuestion.initQuestion(iCorrect);
        
    } else {
        var quizRes = quiz.right * 100 / quiz.count;
        quizRes = 90;
        $("#quizresult").text(quizRes >= 85 ? "Excellent Job" :
                             quizRes >= 60 ? "Well Done" : "More Practice Please");
        var rightWrong = [];
        rightWrong.push(new itemInfo('right', quiz.right));
        rightWrong.push(new itemInfo('wrong', quiz.count-quiz.right));
        addChart('chartrightwrong', 'doughnut', 'Right/Wrong', rightWrong);
        
        addChart('charttimeused', 'line', 'Time Used', quiz.answerTime);
        showResult(true);
    }
}

function addChart(idContainer, chartType, chartTitle, dataToDisplay) {
    var chart = new CanvasJS.Chart(idContainer, {
        theme: "theme2",//theme1
        backgroundColor: "transparent", //custom css, looking on the web docs for it
        title:{
            text: chartTitle              
        },
        animationEnabled: false,   // change to true
        data: [              
        {
            // Change type to "bar", "area", "spline", "pie",etc.
            type: chartType,
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

function clearRadioState() {
//    $("input[type='radio']").each(function() {
//        console.log(this.id);
//        console.log(this.checked);
//        if(this.checked) this.checked = false;
//        //removeAttr("checked");
//    });
}
    
function nextQuestion() {
    quiz.done++;
    $("#didit").html(quiz.right + " / " + quiz.done);
    showNextQuestion();
}
