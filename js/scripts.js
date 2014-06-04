function calculate() {

	// Lookup the input and output elements in the document

	var amount = document.getElementById("amount");
	var apr = document.getElementById("apr");
	var years = document.getElementById("years");
	var payment = document.getElementById("payment");
	var total = document.getElementById("total");
	var totalinterest = document.getElementById("totalinterest");

	// Convert interest from percentage to decimal.
	// Convert from annual rate to monthly rate.
	// Convert payment period in years to the number of of monthly payments

	var principal = parseFloat(amount.value);
	var interest = parseFloat(apr.value) / 100 / 12;
	var payments = parseFloat(years.value) * 12;

	// Now calculate the montly payment figure

	var x = Math.pow(1 + interest, payments);
	var monthly = (principal * x * interest) / (x-1);

	// Check for number to be a finite number

	if (isFinite(monthly)) {
		// Fill in the output fields, rounding to 2 decimal places
		payment.innerHTML = monthly.toFixed(2);
		total.innerHTML = (monthly * payments).toFixed(2);
		totalinterest.innerHTML = ((monthly * payments) - principal).toFixed(2);

		// Save user's input so we can restore it next time they visit

		save(amount.value, apr.value, years.value);

		//Advertise: find and display local lenders

		try {
			getLenders(amount.value, apr.value, years.value);
		}
		catch(e) { /* Ignore the errors for now */}

		// Chart loan balance, interest and equity payments
		chart(principal, interest, monthly, payments);
	}
	else{
		// Result was non-number or infinite, which means the input was invalid or incomplete. So, we clear any previously displayed output.
		payment.innerHTML = "";
		total.innerHTML = "";
		totalinterest.innerHTML = "";
		chart();
	}

	// Save the user's input as properties of the localStorage object.

	function save(amount, apr, years) {
		if(window.localStorage) {
			localStorage.loan_amount = amount;
			localStorage.loan_apr = apr;
			localStorage.loan_years = years;
		}
	}

	// Automaticall attemp to restore the input fields when the document first loads

	window.onload = function() {
		if(window.localStorage && localStorage.loan_amount){
			document.getElementById("amount").value = localStorage.loan_amount;
			document.getElementById("apr").value = localStorage.loan_apr;
			document.getElementById("years").value = localStorage.loan_years;
		}
	};


	// ============== Chart ============== //

	function chart(principal, interest, monthly, payments) {
		var graph = document.getElementById("graph"); // Get the canvas tag
		graph.width = graph.width; // Clears and resets the canvas element

		if (arguments.length == 0 || !graph.getContext) return;

		var g = graph.getContext("2d"); // All drawing is done with this object
		var width = graph.width, height = graph.height; // Get the canvas size

		// These functions convert payment numbers and dollar amounts to pixels

		function paymentToX(n) { return n * width/payments; }
		function amountToY(a) { return height-(a * height/(monthly*payments*1.05));}

		// Payments are a straight line from (0,0) to (payments, montly*payments)

		g.moveTo(paymentToX(0), amountToY(0)); // Start at lower left
		g.lineTo(paymentToX(payments),		   // Draw to upper right
			amountToY(monthly*payments));

		g.lineTo(paymentToX(payments), amountToY(0));
		g.closePath();
		g.fillStyle = "#f88";
		g.fill();
		g.font = "bold 12px sans-serif";
		g.fillText("Total Interest Payments", 20,20);

		// Cumulative equity is non-linear and trickier to chart

		var equity = 0;
		g.beginPath();
		g.moveTo(paymentToX(0), amountToY(0)); // Start lower-left
		for(var p = 1; p <= payments; p++){
			var thisMonthsInterest = (principal - equity) * interest;
			equity += (monthly - thisMonthsInterest);
			g.lineTo(paymentToX(p), amountToY(equity));
		}
		g.lineTo(paymentToX(payments), amountToY(0)); // Back to the X axis
		g.closePath();
		g.fillStyle = "green";
		g.fill();
		g.fillText("Total Equity", 20,35);

		// Loop again

		var bal = principal;
		g.beginPath();
		g.moveTo(paymentToX(0), amountToY(bal));
		for(var p = 1; p <= payments; p++){
			var thisMonthsInterest = bal * interest;
			bal -= (monthly - thisMonthsInterest);
			g.lineTo(paymentToX(0), amountToY(bal));
		}
		g.lineWidth = 3;
		g.stroke();
		g.fillStyle = "black";
		g.fillText("Loan Balance", 20,50);

		g.textAlign = "center";
		var y = amountToY(0);
		for( var year = 1; year * 12 <= payments; year++) {
			var x = paymentToX(year*12);
			g.fillRect(x-0.5,y-3,1,3);
			if(year == 1) g.fillText("Year", x, y-5);
			if(year % 5 == 0 && year*12 !== payments)
				g.fillText(String(year), x, y-5);
		}

		// Mark payment amounts along the right edge
		g.textAlign = "right";
		g.textBaseline = "middle";
		var ticks = [monthly*payments, principal];
		var rightEdge = paymentToX(payments);
		for(var i = 0; i < ticks.length; i++){
			var y = amountToY(ticks[i]);
			g.fillRect(rightEdge-3, y-0.5, 3,1);
			g.fillText(String(ticks[i].toFixed(0)), rightEdge-5, y);
		}
	}
}