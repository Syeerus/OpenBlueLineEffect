/**
 * @file Module dealing with colors.
 * @author Syeerus
 *
 * Copyright (C) 2021 Syeerus
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
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Returns RGB values into a hexadecimal string.
 * Doesn't include the pound(#) sign.
 */
export function RgbToHexString(red: number, green: number, blue: number) {
    function zeroPadNumber(num: string, desired_length: number): string {
        if (num.length < desired_length) {
            return ('0').repeat(desired_length - num.length) + num;
        }

        return num;
    }

    return zeroPadNumber(red.toString(16), 2) +
           zeroPadNumber(green.toString(16), 2) +
           zeroPadNumber(blue.toString(16), 2);
}
