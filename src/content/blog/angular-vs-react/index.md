---
title: 'Angular vs React: Which One Should You Choose?'
description: >-
  Angular vs React, direct comparisons, advantages and disadvantages,
  development scenarios, and learning curve, everything in one convenient
  post.
timestamp: 2020-09-08 04:30:00+00:00
updatedTimestamp: 2021-04-27 12:01:10+00:00
tags:
  - web-dev
  - archive
toc: true
draft: false
authors:
  - name: Tanuj Ravi Rao
    url: 'https://tansanrao.com'
---
> [!WARNING]
> This post was restored from the wayback machine archive using LLMs and lightly
> reformatted for this site. A lot of this could be outdated or plain wrong.

Hello everybody! Tansanrao here. There are many articles scattered across the
internet about this hot topic, and yet here I am, writing another one. However,
this one is different. As a developer working with both of these frameworks,
sometimes both in the same app, I’m aiming to give you as much information as
needed with direct comparisons about both frameworks, hoping to guide you into
making the right decision.

## Overview

### React

React is a JavaScript library for UI development. It is managed by Facebook and
an open-source community of developers.

The framework was introduced in May 2013.

### Angular

Angular is an open-source JavaScript framework for web and mobile development.
It is TypeScript-based and managed by Google’s Angular team and the Angular
developer community.

Launched in September 2016, Angular, also known as Angular 2.0, is a complete
rewrite of AngularJS, Angular 1.0, which was introduced in 2010.

## Universality

### React

React is a framework used in both web and mobile development. However, to run
React on mobile, it needs to be compiled with something like [Apache
Cordova](https://cordova.apache.org/) or
[CapacitorJS](https://capacitorjs.com/).

For mobile development without WebViews, there is an additional framework
called React Native.

React can be used to build both single and multi-page web applications.

### Angular

Angular is suitable for both web and mobile development. For mobile
development, for a native look and feel, Angular relies on [Ionic
Framework](https://ionicframework.com/) for the UI components. Furthermore,
similar to React, Angular also has an additional mobile development framework
called [NativeScript](https://nativescript.org/).

Angular can also be used for both single and multi-page web applications.

> Note: Newer versions of Ionic, Cordova, and Capacitor all support Angular and
> React. They are mentioned separately based on common usage combinations.

## External Dependencies

### React

React is a UI framework, so apps written in React rely heavily on additional
libraries such as Redux, React Router, or Helmet to provide state management,
routing, and interaction with an API. Functions such as data binding,
component routing, project generation, form validation, and dependency
injection all require additional modules or libraries to be installed.

### Angular

Angular is a full-fledged software development framework, and it usually does
not require additional libraries to perform basic tasks. All the
above-mentioned functions such as data binding, component-based routing,
project generation, form validation, and dependency injection can be
implemented using Angular packages.

## Development Difficulty

### React

React is minimal. No dependency injection, classic templates, or overly
complicated features. The framework is simple to understand if you already know
JavaScript well.

It is also a very good framework for people just getting into developing
dynamic UI experiences with JavaScript.

However, it takes a lot of time to learn how to set up a proper project because
there are no predefined structures. You will also be required to learn Redux
for state management as it is used in more than 50% of React projects.
Constant updates of these inter-related libraries and frameworks also require
additional effort from the developer to manage and relearn. There are also a
lot of best practices in React that you will be required to learn so as to do
things right.

### Angular

Angular is a huge library, and learning all the concepts associated with it
will take much more time than in the case of React. Angular is complex to
understand, there is a lot of unnecessary syntax, and component management is
intricate. Some features are embedded into the framework core, which means that
the developer cannot avoid learning and using them. There are also multiple
ways of solving any given problem.

Although TypeScript is very similar to JavaScript, it requires additional time
to learn. Since the framework is constantly updated and newer more efficient
methods are added, the developer has to constantly keep learning.

This may sound like a lot of complexity and disadvantages over React, but there
is one major advantage that makes it worth the effort. Angular has a
predefined project structure and TypeScript is a strictly typed language. This
makes sure you are writing highly performant and error-free code in your
application. You also do not have to worry about best practices as the
framework forces them onto you.

## Performance

### React

React’s performance is greatly improved with the introduction of the virtual
DOM, Document Object Model. Since all virtual DOM trees are lightweight and
built on the server, the browser load is reduced. This, coupled with
unidirectional data binding which does not require watchers, makes it really
fast and light to run.

### Angular

Angular performs worse, especially in the case of complex and dynamic web apps.
This is due to bidirectional data binding. Each binding is assigned a watcher
to track changes, and each loop continues until all the watchers and associated
values are checked. However, with recent updates to Angular, namely Angular 9
and 10 bringing the Ivy compiler and renderer, the performance issue is a thing
of the past and Angular is now equal, if not better than React, for complex
applications.

## App Structure

### React

React offers developers freedom to choose their own structure. There is no
"right structure" for a React app. However, the necessity to design the app
structure at the beginning of each project makes it more difficult to start.

React only offers the view layer. Model and controller are added with other
libraries.

The architecture of a React app is component-based. The code is made of React
components, which are rendered with the React DOM library and directed in two
ways:

- Functional:

```js
function Hello(props) {
  return <div>Hello {props.name}</div>;
}
```

- Class-based with ES6 classes:

```js
class Hello extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}
```

### Angular

The structure of Angular is fixed and complex, suitable for experienced
developers.

Angular is based on three layers: model, controller, and view. An object
responsible for the model is initialised by the controller and displayed with
the view.

The application code consists of different Angular components, each written in
four separate files: a TypeScript file to implement the component, an HTML file
to define the view, a CSS file to define the styling, and a special file for
testing.

Links to these files are written in the app directive which displays the
structure of the app.

Angular components are also reusable.

```ts
import { Component } from '@angular/core';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {}
```

## UI Components

### React

UI tools for React are community-developed. There is a wide assortment of paid
and free components on the React portal.

### Angular

Angular has a built-in Material toolkit, and it offers a variety of pre-built
Material Design components such as buttons, layouts, indicators, pop-ups, and
form controls. Because of this, UI development becomes simpler and faster.

## Directives

### React

In React, templates and logic are explained in one place at the end of the
component. It allows a reader to quickly understand the code without prior
React knowledge.

### Angular

In Angular, each template is returned with an attribute. It is a directive of
how the object has to be set. The syntax of Angular directives is complex and
sophisticated, making it hard for an inexperienced reader who hasn’t worked
with Angular.

## State Management

### React

In React, each component has its own state. You can create special components
for holding the state of the entire application or a particular part of it. The
major disadvantage here consists in the fact that the global state needs to be
stored in multiple different parts of the app with data being manually passed
around different component tree levels.

```js
class Clock extends React.Component {
  constructor(props) {
    super(props);
    this.state = { date: new Date() };
  }

  render() {
    return (
      <div>
        <h1>Hello world!</h1>
        <h2>Now is {this.state.date.toLocaleTimeString()}.</h2>
      </div>
    );
  }
}
```

To solve this, we use Redux. The idea is to have the global state represented
by a single stateful object, which is altered by different parts of the app
with the help of reducers, special Redux functions.

### Angular

In Angular, component data is stored in component properties. Parent components
pass data through to child components. State changes in some parts can be
identified and recalculated, but in a large app, it can cause a
multi-directional tree series of updates, which will be difficult to track. The
features can be improved with the help of state management libraries, such as
NgRx or RxJS, which would make sure that the data flow is unidirectional.

```ts
export class HeroListComponent implements OnInit {
  heroes: Hero[];
  selectedHero: Hero;

  constructor(private service: HeroService) {}

  ngOnInit() {
    this.heroes = this.service.getHeroes();
  }

  selectHero(hero: Hero) {
    this.selectedHero = hero;
  }
}
```

## Dependency Injection

### React

React does not fully support dependency injection as it does not fully comply
with the idea of functional programming and data immutability. Instead, it has
a global state for all components.

### Angular

The greatest advantage of Angular rests in the fact that, unlike React, it
supports dependency injection. Therefore, Angular allows having different
lifecycle models for different stores.

```ts
import { Injectable } from '@angular/core';
import { HEROES } from './mock-heroes';

@Injectable({
  // We declare that this service should be created
  // by the root application injector.
  providedIn: 'root'
})
export class HeroService {
  getHeroes() {
    return HEROES;
  }
}
```

## Data Binding

### React

Data binding is the synchronisation of data between model and view. React needs
Redux, which allows you to work with immutable data and makes data flow
unidirectional.

### Angular

Angular works with bidirectional data binding and mutable data. While the
advantages of mutable and immutable data are a matter of heated discussion, it
is definitely easier to work with bidirectional data binding rather than with
the unidirectional approach.

At the same time, bidirectional data binding negatively affects performance
since Angular automatically develops a watcher for each binding.

## Change Detection & Rendering

### React

React uses a virtual Document Object Model, DOM, which enables easily
implementing minor data changes in one element without updating the structure of
the entire tree. The framework creates an in-memory cache of data structure,
computes the changes, and efficiently updates the DOM displayed in the browser.
This way, the entire page seems to be rendered on each change, whereas in
reality, the libraries render changed subcomponents only.

### Angular

Angular uses a real DOM, which updates the entire tree structure even when
changes have taken place in a single element. The real DOM is considered to be
slower and less effective than the virtual DOM.

To compensate for this disadvantage, Angular uses change detection to identify
components that need to be altered. Therefore, the real DOM on Angular performs
as effectively as the virtual DOM on React.

## Wrapping Up

Angular is a full-fledged mobile and web development framework. React is a
framework only for UI development, which can be turned into a full-fledged
solution with the help of additional libraries.

React seems simpler and requires less time and effort to get started. However,
that simplicity quickly turns into a disadvantage as your application increases
in complexity.

Angular itself is more complex and takes quite some time to master. Yet, it is
a powerful tool that offers a holistic web development experience, and once you
learn how to work with it, you reap the benefits.

There is no such thing as the better framework. Both are updated constantly
with new and improved features. As a beginner in programming, you would
probably benefit more from starting with React. As an experienced developer,
you just keep working with what you are most comfortable with.

From an application point of view, if your application is extremely complex,
data-heavy, or is developed by a large team, Angular would be a better pick.
For everything else, React will probably suit you better. At the end of the
day, how developers use a framework matters most.
