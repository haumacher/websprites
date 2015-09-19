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
package de.haumacher.websprite;

import java.io.IOException;
import java.io.Writer;

public class Canvas implements Context {

	private Writer _out;

	public Canvas(Writer out) throws IOException {
		_out = out;
		
		_out.append("(function(e) {");
		_out.append("var c=e.getContext('2d');");
	}

	@Override
	public void moveTo(double x, double y) throws IOException {
		_out.append("c.moveTo(" + x  + "," + y + ");");
	}

	@Override
	public void lineTo(double x, double y) throws IOException {
		_out.append("c.lineTo(" + x  + "," + y + ");");
	}
	
	@Override
	public void stroke() throws IOException {
		_out.append("c.stroke();");
	}
	
	public void close() throws IOException {
		_out.append("})");
	}
	
}