package dashboard

import (
	"fmt"
	"net/http"

	api "github.com/blckit/go-dashboard/handlers/api"
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
