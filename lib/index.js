"use strict";
var nodemailer = require('nodemailer');
var mustache = require('mustache');
var ez = require('ez-streams');
/// !doc
/// ## Writer mailer device
/// 
/// `var ezm = require("ez-mailer")`  
/// 
/// * `writer = ezm.writer(options, transportOptions)`  
///   creates a mailer device to which you can write mails. 
exports.writer = function(options, transportOptions) {
	var transport = nodemailer.createTransport(options);
	if (transportOptions) {
		Object.keys(transportOptions).forEach(function(k) {
			var funcs = transportOptions[k];
			if (!Array.isArray(funcs)) funcs = [funcs];
			funcs.forEach(function(func) {
				transport.use(k, func);
			});
		});
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