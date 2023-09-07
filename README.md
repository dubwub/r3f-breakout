## "Breakout" made in React-three-fiber

Live demo in code sandbox: https://codesandbox.io/s/r3f-breakout-practice-with-particles-and-screenshake-t7y6kr?file=/src/App.tsx

![image](https://github.com/dubwub/r3f-breakout/assets/9725102/e44cfcfa-5bd3-417c-a424-7bda151e6fc8)

This was just a quick sprint for me to learn the basics of react-three-fiber. It's not exactly a "game" because you can't physically lose, but a few key elements:  
(1) Paddle is controlled by left and right  
(2) The ball has some basic collision physics with bricks (although it's sloppily done, I'm basically assuming it's rectangle on rectangle instead of ball on rectangle for simplicity)  
(3) There's a basic screenshake on block break which I'm happy with  
(4) There's some basic particle effects on block break, although I'm not sure if this is the best way to implement it
