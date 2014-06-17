package controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import play.mvc.Controller;
import play.mvc.Result;
import play.mvc.WebSocket;

import java.io.IOException;
import java.util.HashMap;
import java.util.UUID;
import views.html.app;
import static java.util.UUID.randomUUID;

public class Application extends Controller {

    public static ObjectMapper objectMapper = new ObjectMapper();

    public static HashMap<String, GameInstance> game = new HashMap<String, GameInstance>();

    public static Result index() {
        return ok(app.render());
    }

    public static Result generateIdForNewGame() throws IOException {
        GameId gameId = generateId();
        game.put(gameId.id, new GameInstance(gameId.id));
        return ok(objectMapper.writeValueAsString(gameId));
    }


    public static WebSocket<String> startGame() {
        final String gameId = request().getQueryString("gameid");
        final String userId = request().getQueryString("userid");
        return new WebSocket<String>() {

            // Called when the Websocket Handshake is done.
            public void onReady(WebSocket.In<String> in, WebSocket.Out<String> out) {

                GameInstance gameInstance = game.get(gameId);
                try {
                    gameInstance.join(userId, in, out);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }

        };
    }


    public static GameId generateId() {
        UUID uuid = randomUUID();
        return new GameId(uuid.toString());
    }

}
