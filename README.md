# happy-web

## happy-receiver.py ##
Small web server waiting for HTTP HEAD events coming from the Raspberry PI. When
the event is received the
```
/home/pi/happiness.csv
```
is downloaded and placed in the data folder. This causes a refresh on the chart.