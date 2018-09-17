// Copyright © 2018 J. Strobus White.
// This file is part of the blocktop blockchain development kit.
//
// Blocktop is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Blocktop is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with blocktop. If not, see <http://www.gnu.org/licenses/>.

package dashboard

import (
	"fmt"
	"net/http"

	api "github.com/blocktop/go-dashboard/handlers/api"
	"github.com/gin-gonic/contrib/static"
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
)

func Start() error {
	// Set the router as the default one shipped with Gin
	router := gin.Default()
	// Serve frontend static files
	viewsDir := viper.GetString("dashboard.viewsDir")
	router.Use(static.Serve("/", static.LocalFile(viewsDir, true)))
	// Setup route group for the API
	apiRoute := router.Group("/api")
	{
		apiRoute.GET("/", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"message": "pong",
			})
		})
		apiRoute.GET("/metrics/consensus/tree", api.MetricsConsensusTreeHandler)
	}
	// Start and run the server
	host := viper.GetString("dashboard.host")
	port := viper.GetInt("dashboard.port")
	address := fmt.Sprintf("%s:%d", host, port)

	err := router.Run(address)
	if err != nil {
		return err
	}
	return nil
}
