import main from "./main-multi-language.js";
const args = process.argv.slice(2);
const url = args[0];
if (url)
  main(url).then((res) => {
    // console.log(res);
    console.log(`The results :-
    Cart URL:- ${res.cart.url}
    Cart Validity:- ${res.cart.status}
    -------------------------------------------
    Refund URL:- ${res.refund.url}
    Refund Validity:- ${res.refund.status}
    -------------------------------------------
    Privacy URL:- ${res.policy.url}
    Privacy Validity:- ${res.policy.status}
    -------------------------------------------
    Terms URL:- ${res.term.url}
    Terms Validity:- ${res.term.status}
    -------------------------------------------
    DISCLAIMER:-
    This Result's are Generated via pre-Trained Data!
    Consider 3-5% Error in the Results, However the 
    Results are very good!!`);
  });
