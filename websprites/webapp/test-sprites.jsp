<!DOCTYPE html>
<%@page import="de.haumacher.websprite.demo.CanvasTest"%>
<html>
<head>
<title>Canvas Test</title>
<script type="text/javascript" src="websprites.js"></script>
</head>

<body>
<canvas id="c1" width="800" height="600">
</canvas>
<script type="text/javascript">
	<% CanvasTest.writeFun(out); %>(document.getElementById("c1"));
</script>
</body>

</html> 