package qa.qcri.aidr.predict.communication;

import java.io.IOException;
import java.net.ServerSocket;

import org.apache.log4j.Logger;

import qa.qcri.aidr.common.logging.ErrorLog;
import qa.qcri.aidr.predict.common.*;

/**
 * OutputManager listens for new connections on a specified port. New
 * OutputWorkers are created for each client that connects.
 * 
 * @author jrogstadius
 */
public class HttpOutputManager  implements Runnable {

    static ServerSocket server;
    private static Logger logger = Logger.getLogger(HttpOutputManager.class);
    private static ErrorLog elog = new ErrorLog();
    
    @Override
    public void run() {
        try {
			server = new ServerSocket(Integer.parseInt(TaggerConfigurator
					.getInstance().getProperty(
							TaggerConfigurationProperty.HTTP_OUTPUT_PORT)));
			logger.info("Listening for consumer connections on port "
					+ Integer
							.parseInt(TaggerConfigurator
									.getInstance()
									.getProperty(
											TaggerConfigurationProperty.HTTP_OUTPUT_PORT)));

            while (true) {
                if (Thread.interrupted()) {
                    return;
                }

                try {
                    HttpOutputWorker.WorkerFactory factory = new HttpOutputWorker.WorkerFactory();
                    factory.initialize(server.accept());
                    Thread t = new Thread(factory);
                    t.start();
                } catch (IOException e) {
					logger.warn("Failed to establish connection with client on port "
							+ Integer
									.parseInt(TaggerConfigurator
											.getInstance()
											.getProperty(
													TaggerConfigurationProperty.HTTP_OUTPUT_PORT)));
                }
            }
        } catch (IOException e) {
			logger.error("Could not listen on port "
					+ Integer
							.parseInt(TaggerConfigurator
									.getInstance()
									.getProperty(
											TaggerConfigurationProperty.HTTP_OUTPUT_PORT)));
			logger.error(elog.toStringException(e));
        } finally {

            finalize();
        }
    }

    @Override
    protected void finalize() {
        // Objects created in run method are finalized when
        // program terminates and thread exits
        try {
            server.close();
        } catch (IOException e) {
            logger.error("Could not close socket");
            logger.error(elog.toStringException(e));
        }
    }
}
