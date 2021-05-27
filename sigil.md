# The @sigil branch

This @sigil branch drops support and testing of versions of the Node.js enviornment that have passed their prime.  This allows advanced features, for example *asynchronous iterators*, which encourages innovation, and moves twoard a model of streams that can support both Node streams, and whatwg streams for modern browsers.

## Background

The Gulp team has produced some high quality software, this package among them.   They work hard
to maintain a stable API, including the ability to run gulp on some quite old versions of node.  Maintaining compatabiity old versions of node comes at a cost however.

The JavaScript ecosystem is currently
in a state of rapid change state.  The @sigil branch takes operates from a somewhat different philophy:     Node, and V8 have been evolving quickly, adding features programmers want to use.  @sigil will adopt node's [release model](https://nodejs.org/en/about/releases/) that certain designated versions of Node.js are designated "long-term support" for a limited period of time, generally 30 months.   Producion applications should use only *Active LTS* or *Maintenance LTS* releases.

![Active LTS](https://raw.githubusercontent.com/nodejs/Release/master/schedule.svg?sanitize=true)

At the time of this writing in May 2021, Node.js 10 is reaching the end of its maintenance support.   And the sigil branch will not be tested against such older releases.
