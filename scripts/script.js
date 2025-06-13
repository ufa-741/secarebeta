document.addEventListener("DOMContentLoaded", () => {
    // FAQ toggle
    document.querySelectorAll(".faq-question").forEach(button => {
      button.addEventListener("click", () => {
        const answer = button.nextElementSibling;
        document.querySelectorAll(".faq-answer").forEach(item => {
          item.style.display = "none";
        });
        answer.style.display = (answer.style.display === "block") ? "none" : "block";
      });
    });
  });
  
    