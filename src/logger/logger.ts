import * as winston from 'winston';
import { LogLevel } from "./log-level";

const winstonLogger = winston.createLogger( {
	level: 'verbose',  // may be changed by Logger.setLogLevel()
	transports: [
		new winston.transports.Console( {
			format: winston.format.simple()
		} )
	]
} );


/**
 * Abstraction layer for the Winston logger. The methods are in order from
 * highest level of logging to lowest.
 */
class Logger {

	setLogLevel( logLevel: LogLevel ) {
		winstonLogger.level = logLevel;
	}

	debug( message: string ) {
		winstonLogger.log( 'debug', message );
	}

	verbose( message: string ) {
		winstonLogger.log( 'verbose', message );
	}

	info( message: string ) {
		winstonLogger.log( 'info', message );
	}

	log( message: string ) {
		winstonLogger.log( 'info', message );
	}

	warn( message: string ) {
		winstonLogger.log( 'warn', message );
	}

	error( message: string ) {
		winstonLogger.log( 'error', message );
	}

}

const logger = new Logger();
export default logger;