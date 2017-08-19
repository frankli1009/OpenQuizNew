/* =============================================================================================

            this script is for local data access when online OpenDB api does not work
            
============================================================================================= */

//the data of local categories, including the name, id and also the types and difficulties
var localCategoriesData = {
    localCategories: null, //the whole data
    currentCategoryData: null, //current category data, including types and difficulties
    questions: [] //array of category, type, difficulty and index of each question to avoid same question appear
};

//load the quiz category from my own website data when api service breaks down
function loadLocalQuizInfo() {
    $.getJSON("data/categories.json")
    .done(function(data) {
        quiz.maxQuizCount = 10;
        $("#quizcount").attr("title", "Enter the number of questions (5-10)");
        localCategoriesData.localCategories = data;
        loadLocalCategoriesAndSettings(data);
        console.log("Successfully loaded local data/categories.")
        
        $("#quizcategory").on("change", function() {
            var category = parseInt($(this).val());
            localCategoriesData.currentCategoryData = getCategoryObject(category);
            console.log("localCategoriesData.currentCategoryData("+category+"): "+localCategoriesData.currentCategoryData);
            
            var types = getTypesByCategory(category);
            var $allTypeOption = newOption("Any Type", "");
            $("#quiztype").find('option').remove().end().append($allTypeOption);
            var $options = newTypeOptions(types);
            $options.forEach(function($item){
                $("#quiztype").append($item);
            });
            $("#quiztype").trigger("change");
        });
        $("#quiztype").on("change", function() {
            var type = $(this).val();
            console.log("currentType: "+type);
            
            var difficulties = getDifficultiesByType(type);
            var $allDifficultyOption = newOption("Any Difficulty", "");
            $("#quizdifficulty").find('option').remove().end().append($allDifficultyOption);
            var $options = newDifficultyOptions(difficulties);
            $options.forEach(function($item){
                $("#quizdifficulty").append($item);
            });
        });
    })
    .fail(function() {
        console.error("file 'data\categories.json' doesn't exist.");
        connectionFailure();
    });
}

//initialize the settings
function loadLocalCategoriesAndSettings(data) {
    var i = 0;
    var toDel = [];
    data.trivia_categories.forEach(function(category) {
        //console.log(category.name);
        if(hasCategoryQuestions(category)) {
            console.log("category.name: "+category.name);
            $option = $("<option>");
            $option.text(category.name);
            $option.attr("value", category.id);
            $("#quizcategory").append($option);
        } else {
            toDel.push(i);
        }
        i++;
    });
    
    //delete the categories which have no question.
    var iLen = toDel.length;
    for(var j=0; j<iLen; j++) {
        var index = toDel.pop();
        data.trivia_categories.slice(index, 1);
    }
    
    //load quiz settings from localStorage if there is one
    loadQuizSettings();
}

//check a type of a category has the given difficulty
function canUseCategoryType(objCategory, type) {
    if(objCategory === null) return true;
    
    var objType = getTypeObject(objCategory, type);
    if(objType === null) return true;
    
    if(quiz.difficulty !== "") {
        if(hasDifficulty(objType, quiz.difficulty)) return true;
        else return false;    
    } else {
        for(var i=0; i<objType.difficulties.length; i++) {
            var itemD = objType.difficulties[i];
            if(parseInt(itemD.qcount) > 0) return true;
        }
        return false;
    }   
}

//check a category has the given difficulty (in all types)
function canUseCategoryForDifficulty(objCategory, difficulty) {
    if(objCategory === null) return true;
    
    if(difficulty === "") return true;
    
    for(var i=0; i<objCategory.types.length; i++) {
        var itemT = objCategory.types[i];
        
        for(var j=0; j<itemT.difficulties.length; j++) {
            var itemD = itemT.difficulties[j];
            
            if(itemD.difficulty === difficulty && parseInt(itemD.qcount) > 0) return true;
        }
    }
    
    return false;
}

//check a type has the given difficulty
function hasDifficulty(objType, difficulty) {
    if(objType === null) return true;
    
    for(var i=0; i<objType.difficulties.length; i++) {
        var itemD = objType.difficulties[i];
        
        if(itemD.difficulty === difficulty && parseInt(itemD.qcount) > 0) return true;
    }
    
    return false;
}

//check a difficulty has questions
function hasDifficultyQuestions(objDifficulty) {
    if(objDifficulty === null) return true;
    
    return parseInt(objDifficulty.qcount) > 0; 
}

//check a type object has questions
function hasTypeQuestions(objType) {
    for(var i=0; i<objType.difficulties.length; i++) {
        var itemD = objType.difficulties[i];
        
        if(hasDifficultyQuestions(itemD)) return true;
    }
    
    return false;
}

//check a category object has questions
function hasCategoryQuestions(objCategory) {
    for(var i=0; i<objCategory.types.length; i++) {
        var itemT = objCategory.types[i];
        
        if(hasTypeQuestions(itemT)) return true;
    }
    
    return false;
}

//check a category has the given type
function hasType(objCategory, type) {
    if(objCategory === null) return true;
    
    for(var i=0; i<objCategory.types.length; i++) {
        var item = objCategory.types[i];
        
        if(item.type === type) {
            return hasTypeQuestions(item);
        }
    }
    
    return false;
}

//check a category has the given type and difficulty
function canUseCategory(category) {
    var objCategory = getCategoryObject(category);
    if(objCategory === null) return true;
    
    if(quiz.type !== "") {
        if(!hasType(objCategory, quiz.type)) return false;
        return canUseCategoryType(objCategory, quiz.type);
    } else {
        return canUseCategoryForDifficulty(objCategory);
    }
}

//get a random category for a new question when api service breaks down if not selected one
function getQuestionCategory() {
    if(quiz.category > 0) 
        return quiz.category;
    else {
        var max = $("#quizcategory option").length - 1;
        while(true) {
            var index = Math.floor(Math.random() * max) + 1;
            var iCategory = parseInt($("#quizcategory option:eq("+index+")").val());
            if(canUseCategory(iCategory)) return iCategory;
        }
    }
}

//get a random type of a given category for a new question when api service breaks down if not selecting one
function getQuestionType(category) {
    if(quiz.type !== "") {
        return quiz.type;
    } else {
        var objCategory = getCategoryObject(category);
        var types = getTypesByCategory(category);
        var max = types.length;
        while(true) {
            var index = Math.floor(Math.random() * max) + 1;
            var $objType = $("#quiztype option:eq("+index+")");
            var type = $objType.val();
            if(canUseCategoryType(objCategory, type)) return type;
        }
    }
}

//get a random difficulty of a given type and category for a new question when api service breaks down if not selecting one
function getQuestionDifficulty(category, type) {
    if(quiz.difficulty !== "") {
        return quiz.difficulty;
    } else {
        //console.log("category: "+category);
        var objCategory = getCategoryObject(category);
        //console.log("objCategory: "+objCategory);
        var iDifficulty = getDifficultiesByCategory(objCategory, type);
        //console.log("iDifficulty: "+iDifficulty);
        var options = [];
        if((iDifficulty & 1) === 1) options.push("easy");
        if((iDifficulty & 2) === 2) options.push("medium");
        if((iDifficulty & 4) === 4) options.push("hard");
        var index = Math.floor(Math.random() * options.length);
        return options[index];
    }
}

//get a random index of a given difficult, type and category for a new question when api service breaks down
function getQuestionIndex(category, type, difficulty) {
    var objCategory = getCategoryObject(category);
    var objType = getTypeObject(objCategory, type);
    var objDifficulty = getDifficultyObject(objType, difficulty);
    var max = objDifficulty.qcount;
    var index = Math.floor(Math.random() * max);
    return index;
}

//check whether this question is in the questions list
function hasQuestion(category, type, difficulty, index) {
    for(var i=0; i<localCategoriesData.questions.length; i++) {
        var item = localCategoriesData.questions[i];
        
        if(item.category === category && item.type === type && item.difficulty === difficulty && item.index === index) {
            return true;
        }
    }
    
    return false;
}

//get local question of a given index, difficulty, type and category for a new question when api service breaks down
function getLocalQuestion(questions, category, type, difficulty, index) {
    var datafilename = "data/" + category + "_" + type + "_" + difficulty + ".json";
    $.getJSON(datafilename)
    .done(function(data) {
        if(index < data.results.length) questions.results.push(data.results[index]);
        else {
            console.error("index("+index+") overflow("+data.results.length+") in file("+datafilename+")");
            questions.response_code = -1;
        }
    })
    .fail(function() {
        console.error("fail to get data file: "+datafilename);
        questions.response_code = -2;
    });
}

//get new quiz questions when api service breaks down
async function getLocalQuestionsAndStartQuiz() {
    //reset questions of localCategoriesData
    var data = {
        response_code: 0,
        results: []
    };
    localCategoriesData.questions = [];
    
    var i=0;
    do{
        while(true) {
            var category = getQuestionCategory();
            //console.log("question["+i+"].category: "+category);
            var type = getQuestionType(category);
            //console.log("question["+i+"].type: "+type);
            var difficulty = getQuestionDifficulty(category, type);
            //console.log("question["+i+"].difficulty: "+difficulty);
            var index = getQuestionIndex(category, type, difficulty);
            //console.log("question["+i+"].index: "+index);
            if(!hasQuestion(category, type, difficulty, index)) {
                localCategoriesData.questions.push({
                    category: category,
                    type: type,
                    difficulty: difficulty,
                    index: index
                });
                break;
            }
        }
        getLocalQuestion(data, category, type, difficulty, index);
    } while(++i < quiz.count);
    
    while(data.response_code === 0 && data.results.length<quiz.count) {
        await sleep(10);
    }
    
    if(data.response_code === 0) { //data state ok
        startQuiz(data);
    } else {
        console.error("fail to get local quiz data, response_code: "+data.response_code);
        connectionFailure();
    }    
}

//sleep
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//form JQuery Option tag component from option text and option value
function newOption(text, value) {
    $option = $("<option>");
    $option.text(text);
    $option.attr("value", value);
    return $option;
}

//get category object from category 
function getCategoryObject(category) {
    if(category === 0) return null;
    
    for(var i=0; i<localCategoriesData.localCategories.trivia_categories.length; i++) {
        var item = localCategoriesData.localCategories.trivia_categories[i];
        //console.log("item.id: "+item.id+", category: "+category);
        if(parseInt(item.id) === parseInt(category)) {
            //console.log("find one");
            return item;
        } 
    }
    return null;
}

//get type object from catgory object and type
function getTypeObject(objCategory, type) {
    if(objCategory === null) return null;
    
    for(var i=0; i<objCategory.types.length; i++) {
        var item = objCategory.types[i];
        if(item.type === type) return item;
    }
    return null;
}

//get difficulty object from type object and difficulty
function getDifficultyObject(objType, difficulty) {
    if(objType === null) return null;
    
    for(var i=0; i<objType.difficulties.length; i++) {
        var item = objType.difficulties[i];
        
        if(item.difficulty === difficulty) return item;
    }
    return null;
}

//get array of Type of category 
function getTypesByCategory(category) {
    //console.log("category: "+ category);
    var options = [];
    if(category === 0) {
        options.push("multiple");
        options.push("boolean");
    }
    else {
        var objCategory = getCategoryObject(category);
        if(objCategory !== null) {
            objCategory.types.forEach(function(item) {
                if(hasTypeQuestions(item)) options.push(item.type);
            });
        }
    }
    return options;
}

//new $option array of type from type value array
function newTypeOptions(options) {
    var $options = [];
    
    options.forEach(function(item) {
        if(item === "multiple") $options.push(newOption("Multiple Choice", "multiple"));
        else $options.push(newOption("True / False", "boolean"));
    });
    return $options;                                                             
}

//new $option array of difficulty from difficulty value array
function newDifficultyOptions(options) {
    var $options = [];
    
    options.forEach(function(item) {
        if(item === "easy") $options.push(newOption("Easy", "easy"));
        else if(item === "medium") $options.push(newOption("Medium", "medium"));
        else $options.push(newOption("Hard", "hard"));
    });
    return $options;                                                             
}

//get all difficulties of type of a category
function getDifficultiesByCategory(objCategory, type) {
    var iDifficulty = 0;
    
    for(var i=0; i<objCategory.types.length; i++) {
        var typeitem = objCategory.types[i];
        //console.log("typeitem.type: "+typeitem.type);
        
        if(type === "" || typeitem.type === type) {
            //console.log("typeitem.difficulties.length: "+typeitem.difficulties.length);
            for(var j=0; j<typeitem.difficulties.length; j++) {
                var difficultyitem = typeitem.difficulties[j];
                //console.log("difficultyitem.difficulty: "+difficultyitem.difficulty);
                
                if(hasDifficultyQuestions(difficultyitem)) {
                    switch(difficultyitem.difficulty) {
                        case "easy":
                            if((iDifficulty & 1) === 0) iDifficulty += 1;
                            break;
                        case "medium":
                            if((iDifficulty & 2) === 0) iDifficulty += 2;
                            break;
                        case "hard":
                            if((iDifficulty & 4) === 0) iDifficulty += 4;
                            break;

                    }
                }
                if(iDifficulty === 7) break;
            }

            if(iDifficulty === 7) break;
        }
        
    }
    //console.log("iDifficulty: "+iDifficulty);
    return iDifficulty;
}

//get array of Difficulty of Type of current category
function getDifficultiesByType(type) {
    var options = [];
    var iDifficulty = 0;
    if(localCategoriesData.currentCategoryData === null) {
        if(type === "") {
            iDifficulty = 7;
        }
        else {
            for(var i=0; i<localCategoriesData.localCategories.trivia_categories.length; i++) {
                var item = localCategoriesData.localCategories.trivia_categories[i];
                
                var iTempDifficulty = getDifficultiesByCategory(item, type);
                iDifficulty |= iTempDifficulty;
                if(iDifficulty === 7) break;
            }
        }
    } else {
        iDifficulty = getDifficultiesByCategory(localCategoriesData.currentCategoryData, type);
    }
    console.log("iDifficulty: "+iDifficulty);
    if((iDifficulty & 1) === 1) options.push("easy");
    if((iDifficulty & 2) === 2) options.push("medium");
    if((iDifficulty & 4) === 4) options.push("hard");
    return options;
}