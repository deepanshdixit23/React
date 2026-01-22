import React from "react";
import "./App.css";

function App() {
  return (
    <div className="App">
      {/* Hero Section */}
      <section className="hero">
        <h1>Deepansh Dixit</h1>
        <p>Full Stack Developer | Problem Solver | Learner</p>
      </section>

      {/* About Section */}
      <section className="about">
        <h2>About Me</h2>
        <img
          src="profile-picture.jpg"
          alt="Deepansh Dixit"
          className="profile
-picture"
        />
        <p>
          Welcome to my portfolio website! I'm Deepansh Dixit, a passionate full
          stack developer with a knack for solving complex problems.
        </p>
        <p>
          I specialize in creating efficient, scalable, and user-friendly
          applications using modern technologies.
        </p>
      </section>

      {/* Skills Section */}
      <section className="skills">
        <h2>My Skills</h2>
        <ul>
          <li>JavaScript (ES6+)</li>
          <li>ReactJS</li>
          <li>Node.js</li>
          <li>Express</li>
          <li>MongoDB</li>
          <li>HTML5 & CSS3</li>
          <li>Git & GitHub</li>
        </ul>
      </section>

      {/* Projects Section */}
      <section className="projects">
        <h2>Projects</h2>
        <div className="project-grid">
          <div className="project-card">
            <h3>Project Name: Weather Dashboard</h3>
            <p>
              A weather app that displays current temperature, humidity, and
              forecast for any city worldwide.
            </p>
            <a href="#" target="_blank">
              View Live
            </a>
          </div>
          <div className="project-card">
            <h3>Project Name: Task Manager</h3>
            <p>
              A simple task management application built with React and Node.js
              .
            </p>
            <a href="#" target="_blank">
              View Live
            </a>
          </div>
          {/* Add more project cards as needed */}
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact">
        <h2>Contact Me</h2>
        <form action="/send-email" method="POST">
          <input type="text" placeholder="Your Name" required />
          <input type="email" placeholder="Your Email" required />
          <textarea placeholder="Your Message" required></textarea>
          <button type="submit">Send</button>
        </form>
      </section>
    </div>
  );
}

export default App;
