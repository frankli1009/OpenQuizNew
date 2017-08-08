var quiz = {
    questions: null,
    count: 0,
    index: -1,
    done: 0,
    right: 0,
    countDown: 5,
    initQuiz: function (data) {
        this.questions = data;
        this.index = -1;
        this.count = data.results.length;
        this.done = 0;
        this.right = 0;
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
        console.log(e.keyCode);
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
    
    $("input[type='radio']").on("change", function() {
        console.log(this.id);
        console.log(this.value);
        if(parseInt(this.value) === curQuestion.iCorrect) quiz.right++;
        clearInterval(curQuestion.cntdwnInt);
        curQuestion.cntdwnInt = null;
        nextQuestion();
    })
        
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
        
        $("#didit").html("You did: 0 / 0");
        
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
            } else {
                if(i<iCorrect) {
                    $("#ques1"+i).text(question.incorrect_answers[i]);
                } else {
                    $("#ques1"+i).text(question.incorrect_answers[i-1]);
                }
            }
            
        }
        
        if(question.type === "multiple") {
            $("#quesrow2").show();
        } else {
            $("#quesrow2").hide();
        }
        
        curQuestion.initQuestion(iCorrect);
        
    } else {
        showResult(true);
    }
}

function getAnswerCount(type) {
    return type === "multiple" ? 4 : 2;
}

function getCorrectIndex(answerCount) {
    return Math.floor(Math.random() * answerCount);
}

function clearRadioState() {
    $("input[type='radio']").each(function() {
        console.log(this.id);
        console.log(this.checked);
        if(this.checked) this.checked = false;
        //removeAttr("checked");
    });
}
    
function nextQuestion() {
    quiz.done++;
    $("#didit").html("You did: "+quiz.right + " / " + quiz.done);
    showNextQuestion();
}

