## Writer mailer device

`var ezm = require("ez-mailer")`  

* `writer = ezm.writer(options)`  
  `transform` is an object that can contain `toText` property (boolean) to apply htmlToText transformation  
  creates a mailer device to which you can write mails. 
* `writer = ezm.formatter(options)`  
  returns a mustache mapper that applies a template to a mail message on all first level string properties
