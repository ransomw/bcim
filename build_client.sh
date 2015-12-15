#! /bin/sh

cp node_modules/c3/c3.css www/css/c3.css

# todo: make this a node script for portability

watchify --debug \
         client/main.js \
         -o www/bundle.js
