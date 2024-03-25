document.addEventListener('DOMContentLoaded', function () {
  const questionContainer = document.getElementById('question-container');
  const modalContainer = document.getElementById('modal-container');
  const modalText = document.getElementById('modal-text');
  const resultContainer = document.getElementById('result-container');
  const retakeButton = document.getElementById('retake-btn');
  let currentQuestionIndex = 0;
  let incorrectQuestions = [];
  let questions = [];

  // Fetch data from data.json file
  fetch('data.json')
    .then(response => response.json())
    .then(data => {
      questions = data.filter(question => question.type !== 'lastQuestion'); // Exclude lastQuestion from randomization

      function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      }

      questions = shuffleArray(questions); // Randomize questions except lastQuestion

      function showQuestion(questionIndex) {
        const question = questions[questionIndex];
        let shuffledAnswers = [];
        if (question.type === 'select multiple') {
          shuffledAnswers = shuffleArray([...question.correct_answers, ...question.wrong_answers]);
        } else if (question.type === 'boolean') {
          shuffledAnswers = ['True', 'False'];
        } else if (question.type === 'multiple choice') {
          shuffledAnswers = shuffleArray([...question.wrong_answers, question.correct_answers]);
        }
        questionContainer.innerHTML = `
          <div class="question">${question.question}</div>
          <div class="options">
            ${generateOptions(shuffledAnswers)}
          </div>
          <button id="submit-btn">Submit Answer</button>
        `;
        document.getElementById('submit-btn').addEventListener('click', handleAnswer);
      }

      function generateOptions(answers) {
        let optionsHtml = '';
        answers.forEach(answer => {
          optionsHtml += `
            <label>
              <input type="${questions[currentQuestionIndex].type === 'select multiple' ? 'checkbox' : 'radio'}" name="${questions[currentQuestionIndex].name}" value="${answer}">
              ${answer}
            </label>
          `;
        });
        return optionsHtml;
      }

      function showModal(correctAnswers) {
        let correctAnswersList = '';
        if (Array.isArray(correctAnswers)) {
          correctAnswersList = correctAnswers.map(answer => `<li>${answer}</li>`).join('');
        } else {
          correctAnswersList = `<li>${correctAnswers}</li>`;
        }
        modalText.innerHTML = `
          <h1 class="modal-title">Incorrect!</h1>
          <h2 class="modal-subtitle">The correct answer${Array.isArray(correctAnswers) && correctAnswers.length > 1 ? 's' : ''} ${Array.isArray(correctAnswers) && correctAnswers.length > 1 ? 'are' : 'is'}:</h2>
          <ul class="modal-answers">
            ${correctAnswersList}
          </ul>
        `;
        modalContainer.style.display = 'block';
      }

      function hideModal() {
        modalContainer.style.display = 'none';
      }

      function handleAnswer() {
        const question = questions[currentQuestionIndex];
        const userAnswer = getUserAnswer(question.name);
        if (isAnswerCorrect(question, userAnswer)) {
          nextQuestion();
        } else {
          showModal(question.correct_answers);
          incorrectQuestions.push(question);
          showNextButton();
          document.getElementById("submit-btn").style.display = "none";
        }
      }

      function nextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length - 1) {
          showQuestion(currentQuestionIndex);
        } else if (currentQuestionIndex === questions.length - 1) {
          showFinishButton();
        } else {
          showResults();
        }
      }

      function showNextButton() {
        questionContainer.innerHTML += '<button id="next-btn">Next Question</button>';
        document.getElementById('next-btn').addEventListener('click', nextQuestion);
      }

      function showFinishButton() {
        questionContainer.innerHTML = '<button id="finish-btn">Finish</button>';
        document.getElementById('finish-btn').addEventListener('click', showResults);
      }

      function getUserAnswer(questionName) {
        const questionElement = document.querySelector(`[name="${questionName}"]:checked`);
        return questionElement ? questionElement.value : '';
      }

      function isAnswerCorrect(question, userAnswer) {
        if (question.type === 'select multiple') {
          const correctAnswers = question.correct_answers;
          const selectedAnswers = Array.from(document.querySelectorAll(`[name="${question.name}"]:checked`)).map(input => input.value);
          return selectedAnswers.length === correctAnswers.length && selectedAnswers.every(answer => correctAnswers.includes(answer));
        } else if (question.type === 'multiple choice') {
          return userAnswer === question.correct_answers;
        } else if (question.type === 'boolean') {
          return userAnswer === question.correct_answers;
        }
      }

      function showResults() {
        resultContainer.style.display = 'block'; // Show the results container
        questionContainer.style.display = 'none'; // Hide the question container
        resultContainer.innerHTML = '';
        resultContainer.innerHTML += '<h2>Results:</h2>';
        incorrectQuestions.forEach(question => {
          resultContainer.innerHTML += `<div id="resultQuestion">${question.question}:</div>`;
          if (Array.isArray(question.correct_answers)) {
            resultContainer.innerHTML += '<ul id="resultAnswer">';
            question.correct_answers.forEach(answer => {
              resultContainer.innerHTML += `<li style="font-size: 1.5vh; list-style: none;">${answer}</li>`;
            });
            resultContainer.innerHTML += '</ul>';
          } else {
            resultContainer.innerHTML += `<div id="resultAnswer">${question.correct_answers}</div>`;
          }
        });
        resultContainer.innerHTML += `<div>Total Questions: ${questions.length}</div>`;
        resultContainer.innerHTML += `<div>Correct Answers: ${questions.length - incorrectQuestions.length}</div>`;
        resultContainer.innerHTML += `<div>Incorrect Answers: ${incorrectQuestions.length}</div>`;
        resultContainer.innerHTML += '<button id="retake-btn">Retake Test</button>';
        document.getElementById('retake-btn').addEventListener('click', retakeTest);
      }

      function retakeTest() {
        resultContainer.style.display = 'none'; // Hide the results container
        questionContainer.style.display = 'block'; // Show the question container
        currentQuestionIndex = 0;
        incorrectQuestions = [];
        questionContainer.innerHTML = ''; // Clear the question container
        resultContainer.innerHTML = ''; // Clear the result container
        modalContainer.style.display = 'none'; // Hide the modal
        showQuestion(currentQuestionIndex);
      }

      // Event listeners
      modalContainer.addEventListener('click', hideModal);
      modalText.addEventListener('click', function (event) {
        event.stopPropagation(); // Prevent the click event from propagating to the modal container
      });

      // Start the test
      showQuestion(currentQuestionIndex);
    });
});

