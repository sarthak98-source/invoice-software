/**
 * Convert a number to Indian Rupee words (e.g., "One Thousand Two Hundred Rupees Only")
 */
const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertChunk(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertChunk(n % 100) : '');
}

export function numberToWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';

  const integer = Math.floor(Math.abs(num));
  const paise = Math.round((Math.abs(num) - integer) * 100);

  let words = '';

  if (integer >= 10000000) {
    words += convertChunk(Math.floor(integer / 10000000)) + ' Crore ';
  }
  const remaining = integer % 10000000;
  if (remaining >= 100000) {
    words += convertChunk(Math.floor(remaining / 100000)) + ' Lakh ';
  }
  const remaining2 = remaining % 100000;
  if (remaining2 >= 1000) {
    words += convertChunk(Math.floor(remaining2 / 1000)) + ' Thousand ';
  }
  const remaining3 = remaining2 % 1000;
  if (remaining3 > 0) {
    words += convertChunk(remaining3);
  }

  words = words.trim() + ' Rupees';
  if (paise > 0) {
    words += ' and ' + convertChunk(paise) + ' Paise';
  }
  words += ' Only';
  return words;
}
