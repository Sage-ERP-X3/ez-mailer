"use strict";
var nodemailer = require('nodemailer');
var htmlToText = require('nodemailer-html-to-text').htmlToText;
var mustache = require('mustache');
var ez = require('ez-streams');
/// !doc
/// ## Writer mailer device
/// 
/// `var ezm = require("ez-mailer")`  
/// 
/// * `writer = ezm.writer(options, transform)`  
///   `transform` is an object that can contain `toText` property (boolean) to apply htmlToText transformation  
///   creates a mailer device to which you can write mails. 
exports.writer = function(options, transform) {
	var transport = nodemailer.createTransport(options);
	if (transform.toText) {
		transport.use('compile', htmlToText());
	}
	return ez.devices.generic.writer(function(cb, message) {
		if (message === undefined) return cb();
		var msg = Object.create(message);
		// because Object.create doesn't keep message's properties
		for (var key in message) {
			msg[key] = message[key];
		}
		if (message.attachments) msg.attachments = message.attachments.map(function(att) {
			if (typeof att.read !== "function") return att;
			// ez-streams reader
			var headers = att.headers;
			return {
				cid: att.attName && (att.attName + "@img"),
				content: att.nodify(),
				contentType: headers && headers.contentType,
				encoding: headers && headers.encoding,
				filename: headers && headers.filename,
			};
		});
		return transport.sendMail(msg, cb);
	});
};

/// * `writer = ezm.formatter(options)`  
///   returns a mustache mapper that applies a template to a mail message on all first level string properties
exports.messageFormatter = function(options) {
	return function(cb, message) {
		var result = {};
		// because we want to apply mustache render on every string properties on message object
		Object.keys(options).forEach(function(k) {
			if (typeof options[k] === "string") {
				result[k] = mustache.render(options[k], message.view);
			} else {
				result[k] = options[k];
			}
		});
		result.attachments = message.attachments || options.attachments;
		return cb(null, result);
	};
};