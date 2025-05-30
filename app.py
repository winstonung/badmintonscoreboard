from flask import Flask, render_template, jsonify, request, redirect, session, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.types import Text
from werkzeug.security import generate_password_hash, check_password_hash
import json
import os
from dotenv import load_dotenv, dotenv_values 

load_dotenv()

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///site.db"

db = SQLAlchemy(app)

app.secret_key = os.getenv("BADMINTONSCOREBOARD", "NONE")

SCORES_FILE = "scores.json"

class Profile(db.Model):
    __tablename__ = "profiles"

    email = db.Column(db.String(50), primary_key=True)
    password = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(50), nullable=False)

    memberships = db.relationship("ProfileToScoreBoard", back_populates="profile")


class Scoreboard(db.Model): 
    __tablename__ = "scoreboards"

    id = db.Column(db.Integer, primary_key=True)
    current_set = db.Column(db.Integer, nullable=False)
    last_scorer = db.Column(Text, nullable=False)

    player1_name = db.Column(db.String(50), nullable=False)
    player1_country = db.Column(db.String(50), nullable=False)
    player1_countrycode = db.Column(db.String(50), nullable=False)
    player1_flag = db.Column(db.String(50), nullable=False)
    player1_score = db.Column(Text)
    player1_shortname = db.Column(db.String(50), nullable=False)

    player2_name = db.Column(db.String(50), nullable=False)
    player2_country = db.Column(db.String(50), nullable=False)
    player2_countrycode = db.Column(db.String(50), nullable=False)
    player2_flag = db.Column(db.String(50), nullable=False)
    player2_score = db.Column(Text)
    player2_shortname = db.Column(db.String(50), nullable=False)

    memberships = db.relationship("ProfileToScoreBoard", back_populates="scoreboard")


class ProfileToScoreBoard(db.Model):
    __tablename__ = "memberships"

    email = db.Column(db.String, db.ForeignKey("profiles.email"), primary_key=True)
    scoreboardid = db.Column(db.Integer, db.ForeignKey("scoreboards.id"), primary_key=True)

    profile = db.relationship("Profile", back_populates="memberships")
    scoreboard = db.relationship("Scoreboard", back_populates="memberships")


@app.route("/create_scoreboard", methods=["POST"])
def create_scoreboard():
    if "user_email" not in session:
        return redirect(url_for("login"))

    user_email = session["user_email"]
    user = Profile.query.filter_by(email=user_email).first()

    if not user:
        flash("User not found.", "error")
        return redirect(url_for("dashboard"))

    # Create a new scoreboard with default values
    new_scoreboard = Scoreboard(
        current_set=0,
        last_scorer=json.dumps([[], [], []]),
        player1_name="Player 1",
        player1_country="Great Britain",
        player1_countrycode="GBR",
        player1_flag="gb.png",
        player1_score=json.dumps([[0], [0], [0]]),
        player1_shortname="P1",
        player2_name="Player 2",
        player2_country="Great Britain",
        player2_countrycode="GBR",
        player2_flag="gb.png",
        player2_score=json.dumps([[0], [0], [0]]),
        player2_shortname="P2"
    )

    db.session.add(new_scoreboard)
    db.session.commit()  # Save to generate ID

    # Create membership link
    membership = ProfileToScoreBoard(
        email=user.email,
        scoreboardid=new_scoreboard.id
    )

    db.session.add(membership)
    db.session.commit()

    flash("New scoreboard created!", "success")
    return redirect(url_for("dashboard"))

@app.route("/delete_scoreboard/<int:scoreboard_id>", methods=["POST"])
def delete_scoreboard(scoreboard_id):
    if "user_email" not in session:
        return redirect(url_for("login"))

    user_email = session["user_email"]

    membership = ProfileToScoreBoard.query.filter_by(email=user_email, scoreboardid=scoreboard_id).first()
    if not membership:
        flash("You don't have permission to delete this scoreboard.", "error")
        return redirect(url_for("dashboard"))

    # Delete membership first (to avoid foreign key conflict)
    db.session.delete(membership)

    scoreboard = Scoreboard.query.get(scoreboard_id)
    if scoreboard:
        db.session.delete(scoreboard)

    db.session.commit()
    flash("Scoreboard deleted successfully.", "success")
    return redirect(url_for("dashboard"))


@app.route("/api/get_scoreboard", methods=["GET"])
def api_get_scoreboard():
    id=request.args.get("id")
    scoreboard = Scoreboard.query.get(id)
    if not scoreboard:
        return jsonify({"success": False, "Error": "Scoreboard not found"}), 404
    
    # Convert JSON stored in database to Python objects
    return jsonify({
        "success": True,
        "id": scoreboard.id,
        "current_set": scoreboard.current_set,
        "last_scorer": json.loads(scoreboard.last_scorer),  # decode from JSON string
        "player1": {
            "name": scoreboard.player1_name,
            "country": scoreboard.player1_country,
            "countrycode": scoreboard.player1_countrycode,
            "flag": scoreboard.player1_flag,
            "score": json.loads(scoreboard.player1_score),  # decode from JSON string
            "shortname": scoreboard.player1_shortname
        },
        "player2": {
            "name": scoreboard.player2_name,
            "country": scoreboard.player2_country,
            "countrycode": scoreboard.player2_countrycode,
            "flag": scoreboard.player2_flag,
            "score": json.loads(scoreboard.player2_score),  # decode from JSON string
            "shortname": scoreboard.player2_shortname
        }
    })

@app.route("/api/update_score", methods=["POST"])
def api_update_score():
    id = request.json.get("id")
    current_set = request.json.get("current_set")
    last_scorer = request.json.get("last_scorer")
    player1_score = request.json.get("player1_score")
    player2_score = request.json.get("player2_score")

    scoreboard = Scoreboard.query.get(id)
    if not scoreboard:
        return jsonify({"success": False, "Error": "Scoreboard not found"}), 404

    scoreboard.current_set = current_set
    scoreboard.last_scorer = json.dumps(last_scorer)  # save as JSON string
    scoreboard.player1_score = json.dumps(player1_score)
    scoreboard.player2_score = json.dumps(player2_score)

    db.session.commit()

    return jsonify({"success": True})

@app.route("/api/update_names", methods=["POST"])
def api_update_names():
    id = request.json.get("id")
    player1_name = request.json.get("player1_name")
    player1_country = request.json.get("player1_country")
    player1_countrycode = request.json.get("player1_countrycode")
    player1_flag = request.json.get("player1_flag")
    player1_shortname = request.json.get("player1_shortname")
    player2_name = request.json.get("player2_name")
    player2_country = request.json.get("player2_country")
    player2_countrycode = request.json.get("player2_countrycode")
    player2_flag = request.json.get("player2_flag")
    player2_shortname = request.json.get("player2_shortname")

    scoreboard = Scoreboard.query.get(id)
    if not scoreboard:
        return jsonify({"success": False, "Error": "Scoreboard not found"}), 404

    scoreboard.player1_name = player1_name
    scoreboard.player1_country = player1_country
    scoreboard.player1_countrycode = player1_countrycode
    scoreboard.player1_flag = player1_flag
    scoreboard.player1_shortname = player1_shortname
    scoreboard.player2_name = player2_name
    scoreboard.player2_country = player2_country
    scoreboard.player2_countrycode = player2_countrycode
    scoreboard.player2_flag = player2_flag
    scoreboard.player2_shortname = player2_shortname

    db.session.commit()

    return jsonify({"success": True})


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form["username"]
        password = request.form["password"]

        # Retrieve user by email
        user = Profile.query.filter_by(email=email).first()

        if user and check_password_hash(user.password, password):  # Check if password matches
            session["user_email"] = user.email  # Store the user's email in the session
            return redirect(url_for("dashboard"))  # Redirect to the dashboard or a protected page
        else:
            flash("Invalid credentials, please try again.", "error")

    return render_template("login.html")

@app.route("/logout")
def logout():
    session.pop("user_email", None)  # Remove user email from session
    return redirect(url_for("login"))


@app.route("/dashboard")
def dashboard():
    if "user_email" not in session:
        return redirect(url_for("login"))

    user_email = session["user_email"]
    user = Profile.query.filter_by(email=user_email).first()
    memberships = ProfileToScoreBoard.query.filter_by(email=user_email).all()
    scoreboards = [membership.scoreboard for membership in memberships]

    return render_template("dashboard.html", user=user, scoreboards=scoreboards)


@app.route("/scoreboard/<int:scoreboard_id>")
def view_scoreboard(scoreboard_id):
    Scoreboard.query.get_or_404(scoreboard_id)
    return render_template("home.html", scoreboard_id=scoreboard_id)


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = request.form["name"]
        email = request.form["email"]
        password = request.form["password"]
        confirm_password = request.form["confirm_password"]

        # Check if the passwords match
        if password != confirm_password:
            flash("Passwords do not match. Please try again.", "error")
            return redirect(url_for("register"))

        # Check if the email is already taken
        if Profile.query.filter_by(email=email).first():
            flash("Email is already registered. Please login.", "error")
            return redirect(url_for("login"))

        # Hash the password before storing it
        hashed_password = generate_password_hash(password)

        # Create a new Profile record and add it to the database
        new_user = Profile(email=email, password=hashed_password, name=name)
        db.session.add(new_user)
        db.session.commit()

        flash("Registration successful! You can now log in.", "success")
        return redirect(url_for("login"))

    return render_template("register.html")


@app.route("/")
def home():
    return render_template("login.html")

@app.route("/scoreboard/<int:scoreboard_id>/view1")
def view1(scoreboard_id):
    Scoreboard.query.get_or_404(scoreboard_id)
    return render_template("scoreboard1.html", scoreboard_id=scoreboard_id)

@app.route("/scoreboard/<int:scoreboard_id>/admin")
def admin(scoreboard_id):
    if "user_email" not in session:
        return redirect(url_for("login"))
    
    Scoreboard.query.get_or_404(scoreboard_id)
    return render_template("admin.html", scoreboard_id=scoreboard_id)

@app.route("/scoreboard/<int:scoreboard_id>/view2")
def view2(scoreboard_id):
    Scoreboard.query.get_or_404(scoreboard_id)
    return render_template("scoreboard2.html", scoreboard_id=scoreboard_id)

@app.route("/scoreboard/<int:scoreboard_id>/view3")
def view3(scoreboard_id):
    Scoreboard.query.get_or_404(scoreboard_id)
    return render_template("scoreboard3.html", scoreboard_id=scoreboard_id)

@app.route("/scoreboard/<int:scoreboard_id>/view4")
def view4(scoreboard_id):
    Scoreboard.query.get_or_404(scoreboard_id)
    return render_template("scoreboard4.html", scoreboard_id=scoreboard_id)

@app.route("/scoreboard/<int:scoreboard_id>/view5")
def view5(scoreboard_id):
    Scoreboard.query.get_or_404(scoreboard_id)
    return render_template("scoreboard5.html", scoreboard_id=scoreboard_id)

@app.route("/scoreboard/<int:scoreboard_id>/view6")
def view6(scoreboard_id):
    Scoreboard.query.get_or_404(scoreboard_id)
    return render_template("scoreboard6.html", scoreboard_id=scoreboard_id)

@app.route("/scoreboard/<int:scoreboard_id>/tv")
def tv(scoreboard_id):
    Scoreboard.query.get_or_404(scoreboard_id)
    return render_template("tv.html", scoreboard_id=scoreboard_id)

@app.route("/scoreboard/<int:scoreboard_id>/umpire")
def umpire(scoreboard_id):
    if "user_email" not in session:
        return redirect(url_for("login"))
    
    Scoreboard.query.get_or_404(scoreboard_id)
    return render_template("umpire.html", scoreboard_id=scoreboard_id)

@app.route("/api/countries")
def get_countries():
    countries_file = os.path.join(app.static_folder, "countries.json")
    with open(countries_file) as f:
        countries_data = json.load(f)
    return jsonify(countries_data)

@app.route("/test")
def test():
    return render_template("testhome.html")

if __name__ == "__main__":
    with app.app_context():  # Needed for DB operations
        db.create_all()      # Creates the database and tables
    app.run(debug=True)
