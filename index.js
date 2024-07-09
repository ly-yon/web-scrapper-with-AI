import main from "./main.js";
main("https://www.centrepointstores.com/").then((res) => {
  // console.log(res);
  console.log(`The results are:-
    Domain:- ${res.Domain}
    Refund URL:- ${res.Refund.url ? res.Refund.url : "The link is EMPTY!"}
    Refund Validity:- ${res.Refund.valid}
    -------------------------------------------
    Privacy URL:- ${res.Privacy.url ? res.Privacy.url : "The link is EMPTY!"}
    Privacy Validity:- ${res.Privacy.valid}
    -------------------------------------------
    Terms URL:- ${res.Term.url ? res.Term.url : "The link is EMPTY!"}
    Terms Validity:- ${res.Term.valid}
    
    DISCLAIMER:-
    This Result's are Generated via pre-Trained Data!
    Consider 5-10% Error in the Results, However the 
    Results are very good!!`);
});
