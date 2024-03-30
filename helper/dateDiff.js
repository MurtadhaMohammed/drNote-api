function dateDiff(d1, d2, get_item) {
  var date1 = new Date(d1);
  var date2 = new Date(d2);
  var Difference_In_Time = date1.getTime() - date2.getTime();
  switch (get_item) {
    case "month":
      return Math.round(Difference_In_Time / (1000 * 3600 * 24 * 30));
    case "day":
      return Math.round(Difference_In_Time / (1000 * 3600 * 24));
    case "hour":
      return Math.round(Difference_In_Time / (1000 * 3600));
    case "minute":
      return Math.round(Difference_In_Time / (1000 * 60));
    case "second":
      return Math.round(Difference_In_Time / 1000);
    default:
      break;
  }
}

module.exports = dateDiff;
