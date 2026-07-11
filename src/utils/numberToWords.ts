export function numberToWords(num: number): string {
  if (num === 0) return "Zero Rupees Only";
  
  // Handle decimal parts separately
  const mainPart = Math.floor(num);
  const decimalPart = Math.round((num - mainPart) * 100);

  let result = convertIndianNumber(mainPart) + " Rupees";
  
  if (decimalPart > 0) {
    result += " and " + convertIndianNumber(decimalPart) + " Paise";
  }
  
  return result + " Only";
}

function convertIndianNumber(n: number): string {
  const singleDigits = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const doubleDigits = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tensDigits = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  if (n === 0) return "";
  
  if (n < 10) return singleDigits[n];
  if (n < 20) return doubleDigits[n - 10];
  
  if (n < 100) {
    const units = n % 10;
    return tensDigits[Math.floor(n / 10)] + (units > 0 ? " " + singleDigits[units] : "");
  }
  
  if (n < 1000) {
    const remainder = n % 100;
    return singleDigits[Math.floor(n / 100)] + " Hundred" + (remainder > 0 ? " and " + convertIndianNumber(remainder) : "");
  }
  
  if (n < 100000) {
    const remainder = n % 1000;
    return convertIndianNumber(Math.floor(n / 1000)) + " Thousand" + (remainder > 0 ? " " + convertIndianNumber(remainder) : "");
  }
  
  if (n < 10000000) {
    const remainder = n % 100000;
    return convertIndianNumber(Math.floor(n / 100000)) + " Lakh" + (remainder > 0 ? " " + convertIndianNumber(remainder) : "");
  }
  
  const remainder = n % 10000000;
  return convertIndianNumber(Math.floor(n / 10000000)) + " Crore" + (remainder > 0 ? " " + convertIndianNumber(remainder) : "");
}
