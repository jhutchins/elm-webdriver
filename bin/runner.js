var cl = require('chalkline');
var chalk = require('chalk');
var ProgressBar = require('ascii-progress');

if (process.argv.length < 3) {
  throw 'A path to an Elm-compiled file is required';
}

var elm = require(process.argv[2]);

if (typeof elm === 'undefined') {
  throw 'Invalid Elm file. Make sure you provide a file compiled by Elm!'
}

if (typeof elm.Main === 'undefined' ) {
  throw 'Main is not defined. Make sure your module is named Main.'
}

var main = elm.Main.worker();
var statusBars = {};

main.ports.emitStatus.subscribe(function (statuses) {
  statuses.forEach(function (status) {
    statusBars[status[0]] = new ProgressBar({
      schema: "\n:name.magenta\n :bar.green :current/:total (:percent)",
      total : status[1].total
    });

    statusBars[status[0]].tick(0, {name: status[0]});
  });
});

main.ports.emitStatusUpdate.subscribe(function (statuses) {
  statuses
    .filter(function (status) {
      return typeof statusBars[status[0]] !== 'undefined';
    })
    .forEach(function (status) {
      var bar = statusBars[status[0]];
      var ticks =  (status[1].total - status[1].remaining) - bar.current;
      bar.tick(ticks, {name: status[0]});
    });
});

main.ports.printLog.subscribe(function (summary) {
  var name = summary[0];
  var summary = summary[1];
  var fn = summary.failed > 0 ? cl.red : cl.green;


  fn();
  console.log(name);
  fn();

  console.log(summary.output);
});

main.ports.exit.subscribe(function (summary) {
  var bg = summary.failed == 0 ? chalk.bgGreen : chalk.bgRed;

  console.log(bg(chalk.white(summary.output)))

  if (summary.failed > 0) {
    process.exit(1);
  }

  process.exit(0);
});