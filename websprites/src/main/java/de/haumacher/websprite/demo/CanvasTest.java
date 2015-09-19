/*
 * TimeCollect records time you spent on your development work.
 * Copyright (C) 2015 Bernhard Haumacher and others
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package de.haumacher.websprite.demo;

import java.io.IOException;
import java.io.Writer;

import de.haumacher.websprite.Canvas;

public class CanvasTest {

	public static void writeFun(Writer out) throws IOException {
		Canvas canvas = new Canvas(out);
		
		new Star(canvas, 100, 11).moveTo(110, 110).render().moveTo(240,  150).render();
		canvas.stroke();
		canvas.close();
	}

}
