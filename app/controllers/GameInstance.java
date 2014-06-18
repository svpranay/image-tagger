package controllers;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import play.Logger;
import play.libs.F;
import play.libs.WS;
import play.mvc.WebSocket;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import static play.libs.F.Promise;


public class GameInstance {

    public String gameId;
    public List<GameRun> gameRounds;

    public PhotoResponse photoResponse;
    public int currRound;
    WebSocket.In<String> ain;
    WebSocket.In<String> bin;

    WebSocket.Out<String> aout;
    WebSocket.Out<String> bout;

    public ObjectMapper objectMapper = new ObjectMapper();

    public class GameRun {
        public int round;
        public Photo photo;
        public String atag;
        public String btag;
    }

    public GameInstance(String gameId) throws IOException {
        this.gameId = gameId;
        this.photoResponse = getPhotos();
        gameRounds = new ArrayList<GameRun>();
        for (int i=0;i < this.photoResponse.photos.photo.size(); i++) {
            GameRun gameRun = new GameRun();
            gameRun.round = i;
            gameRun.photo = photoResponse.photos.photo.get(i);
            gameRounds.add(gameRun);
        }

        this.currRound = -1; // next rounds starts at 0
    }

    public void join(String userId, WebSocket.In<String> in, WebSocket.Out<String> out) throws IOException {
        if (userId.equalsIgnoreCase("0")) {
            ain = in;
            aout = out;
        } else {
            bin = in;
            bout = out;
        }
        handleMessage(in);
        if (aout != null && bout != null) {
            // both players are ready

            // send the first photo
            advanceGame(false);
        } else {
            // one of the players isn't ready
        }
    }


    public void advanceGame(boolean lastMove) throws JsonProcessingException {
        Logger.info("Advancing to the next round : " + lastMove);
        currRound = currRound + 1;
        Next next = new Next(photoResponse.photos.photo.get(currRound), lastMove, currRound);
        // send next to both the users
        aout.write(objectMapper.writeValueAsString(next));
        bout.write(objectMapper.writeValueAsString(next));
	if (currRound == 10) {
            aout.close();
            bout.close();
            return;
        }

    }


    public void handleMessage(WebSocket.In<String> conn) {
        // For each event received on the socket,
        conn.onMessage(new F.Callback<String>() {
            public void invoke(String event) throws IOException {
                Logger.info("Received message : " + event);
                Move move = objectMapper.readValue(event, Move.class);
                GameRun gameRun = gameRounds.get(currRound);
                if (move.who == 0) {
                    gameRun.atag = move.guess;
                } else {
                    gameRun.btag = move.guess;
                }
                if (gameRun.atag != null && gameRun.btag != null) {
		    // both responses reached else wait for the other guy
		    advanceGame(gameRun.atag.equalsIgnoreCase(gameRun.btag));
                }
            }
        });

        // When the socket is closed.
        conn.onClose(new F.Callback0() {
            public void invoke() {
                Logger.info("closing socket.");

            }
        });
    }

    // server gets the move
    public static class Move {
        @JsonCreator
        public Move(@JsonProperty("who") int who, @JsonProperty("guess") String guess){
            this.who = who;
            this.guess = guess;
        }
        public int who; //0 or 1
        public String guess;
    }

    // server sends the next question
    public static class Next {

        @JsonCreator
        public Next(@JsonProperty("photo") Photo photo, @JsonProperty("lastMove") boolean lastMove,
                    @JsonProperty("round") int round){
            this.photo = photo;
            this.lastMove = lastMove;
            this.round = round;
        }
        // { "id": "14417151924", "secret": "5474363a04", "server": "5590", "farm": 6, },
        public Photo photo;
        public boolean lastMove; // true if both matched
        public int round;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Photo {
        @JsonCreator
        public Photo(@JsonProperty("id") String id, @JsonProperty("secret") String secret,
                     @JsonProperty("server") String server, @JsonProperty("farm") String farm,
                     @JsonProperty("title") String title, @JsonProperty("ispublic") String ispublic,
                     @JsonProperty("isfriend") String isfriend, @JsonProperty("isfamily") String isfamily,
                     @JsonProperty("owner") String owner) {
            this.id = id;
            this.owner = owner;
            this.secret = secret;
            this.server = server;
            this.farm = farm;
            this.title = title;
            this.isfamily = isfamily;
            this.isfriend = isfriend;
            this.ispublic = ispublic;
        }


        public String id;
        public String owner;
        public String secret;
        public String server;
        public String farm;

        public String title;
        public String ispublic;
        public String isfriend;
        public String isfamily;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PhotoResponse {
        @JsonCreator
        public PhotoResponse(@JsonProperty("photos") PhotoList photoList)
        {
            this.photos = photoList;
        }

        public PhotoList photos;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PhotoList {
        @JsonCreator
        public PhotoList(@JsonProperty("photo") List<Photo> photo,
                         @JsonProperty("page") int page,
                         @JsonProperty("pages") int pages,
                         @JsonProperty("perpage") int perpage,
                         @JsonProperty("total") String total) {
            this.photo = photo;
            this.page = page;
            this.pages = pages;
            this.perpage = perpage;
            this.total = total;
        }

        public int page;
        public int pages;
        public int perpage;
        public String total;
        public List<Photo> photo;
    }

    // https://api.flickr.com/services/rest/?method=flickr.interestingness.getList&api_key=ee4298a7f24ffeb0c7b06e737277f858&
    // date=2014-01-01&format=json&nojsoncallback=1
    public PhotoResponse getPhotos() throws IOException {
        String date = getRandomDate();
        Promise<WS.Response> responsePromise = WS.url("https://api.flickr.com/services/rest/").
                setQueryParameter("method", "flickr.interestingness.getList").
                setQueryParameter("api_key", "dd0dd46b613e33001287571b5d1edd45").
                setQueryParameter("date", date).
                setQueryParameter("format", "json").
                setQueryParameter("nojsoncallback", "1").
                setQueryParameter("per_page", "10").
                get();
        WS.Response response = responsePromise.get();
        return objectMapper.readValue(response.getBody(), PhotoResponse.class);
    }

    public String getRandomDate() {
        int[] year = {2010, 2011, 2012, 2013, 2014};
        int randyear = randInt(0,4);
        int randday = randInt(1,30);
        String day = "";
        String month = "";
        if (randday < 10) {
            day = "0" + randday;
        } else {
            day = "" + randday;
        }
        int randmonth = randInt(1,12);
        if (randmonth < 10) {
            month = "0" + randmonth;
        } else {
            month = "" + randmonth;
        }


        return year[randyear] + "-" + month + "-" + day;
    }

    public static int randInt(int min, int max) {

        // Usually this should be a field rather than a method variable so
        // that it is not re-seeded every call.
        Random rand = new Random();

        // nextInt is normally exclusive of the top value,
        // so add 1 to make it inclusive
        int randomNum = rand.nextInt((max - min) + 1) + min;
        return randomNum;
    }

}
